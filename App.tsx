
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStatus } from './types';
import { updateTranscription } from './services/geminiService';
import HandIcon from './components/HandIcon';
import { useHandLandmarker } from './hooks/useHandLandmarker';
import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision';
import ASLAlphabetGuide from './components/ASLAlphabetGuide';
import SASLAlphabetGuide from "./components/SASLAlphabetGuide";
import BookOpenIcon from './components/BookOpenIcon';
import DownloadIcon from './components/DownloadIcon';

const App: React.FC = () => {
  const { handLandmarker, loading: modelLoading, error: modelError } = useHandLandmarker();
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [sentence, setSentence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [isASLGuideOpen, setIsASLGuideOpen] = useState<boolean>(false);
  const [isSASLGuideOpen, setIsSASLGuideOpen] = useState<boolean>(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  const [transcriptionInterval, setTranscriptionInterval] = useState<number>(4000);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const transcriptionErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isProcessingFrame = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const latestLandmarks = useRef<any>(null);

  useEffect(() => {
    if (modelLoading) {
      setStatus(AppStatus.LOADING_MODEL);
    } else if (modelError) {
      setError(modelError);
      setStatus(AppStatus.ERROR);
    } else if (status === AppStatus.LOADING_MODEL) {
      setStatus(AppStatus.IDLE);
    }
  }, [modelLoading, modelError, status]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopCamera();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (transcriptionErrorTimeoutRef.current) {
      clearTimeout(transcriptionErrorTimeoutRef.current);
    }
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
    isProcessingFrame.current = false;
  }, [stopCamera]);
  
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const runTranscriptionCycle = useCallback(async () => {
    if (isProcessingFrame.current || !latestLandmarks.current?.landmarks?.length) {
      return;
    }
    isProcessingFrame.current = true;
    try {
      const updatedSentence = await updateTranscription(latestLandmarks.current, sentence);
      
      if (transcriptionError) setTranscriptionError(null);

      // Only update state if the sentence has actually changed to prevent re-renders
      if (updatedSentence !== sentence) {
        setSentence(updatedSentence);
      }
    } catch (err) {
      if (err instanceof Error && (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED"))) {
        setTranscriptionError("Rate limit exceeded. Please wait a moment.");
        if (transcriptionErrorTimeoutRef.current) clearTimeout(transcriptionErrorTimeoutRef.current);
        transcriptionErrorTimeoutRef.current = setTimeout(() => setTranscriptionError(null), 5000);
      }
    } finally {
      isProcessingFrame.current = false;
    }
  }, [sentence, transcriptionError]);

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    if (!video || !handLandmarker || !drawingCanvasRef.current) return;
    if (video.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const landmarks = handLandmarker.detectForVideo(video, performance.now());
    latestLandmarks.current = landmarks;
    
    const canvas = drawingCanvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (canvasCtx) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      if (landmarks.landmarks) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        for (const landmark of landmarks.landmarks) {
          drawingUtils.drawConnectors(landmark, HandLandmarker.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
          drawingUtils.drawLandmarks(landmark, { color: '#FF0000', radius: 4 });
        }
      }
      canvasCtx.restore();
    }

    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, [handLandmarker]);

  const startTranscription = useCallback(() => {
    setStatus(AppStatus.TRANSCRIBING);
    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, [predictWebcam]);

  useEffect(() => {
    if (status === AppStatus.TRANSCRIBING) {
      transcriptionIntervalRef.current = setInterval(runTranscriptionCycle, transcriptionInterval);
      return () => {
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current);
          transcriptionIntervalRef.current = null;
        }
      };
    }
  }, [status, transcriptionInterval, runTranscriptionCycle]);
  
  const handleToggleCamera = useCallback(async () => {
    if (status === AppStatus.TRANSCRIBING) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanup();
      setStatus(AppStatus.IDLE);
      return;
    }

    setError(null);
    setVideoUrl(null);
    recordedChunksRef.current = [];
    setStatus(AppStatus.STARTING_CAMERA);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (MediaRecorder.isTypeSupported('video/webm')) {
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

          mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  recordedChunksRef.current.push(event.data);
              }
          };

          mediaRecorderRef.current.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              setVideoUrl(url);
          };
          
          mediaRecorderRef.current.start();
      } else {
          console.warn("video/webm not supported for recording");
      }


      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (drawingCanvasRef.current && videoRef.current) {
            drawingCanvasRef.current.width = videoRef.current.videoWidth;
            drawingCanvasRef.current.height = videoRef.current.videoHeight;
          }
          startTranscription();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Could not access camera. Please check permissions.";
      if (err instanceof Error && err.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
      }
      setError(errorMessage);
      setStatus(AppStatus.ERROR);
      cleanup();
    }
  }, [status, cleanup, startTranscription]);

  const handleClear = () => {
    setSentence('');
    setVideoUrl(null);
  };
  
  const handleDownloadTranscript = () => {
    const content = `Transcription:\n${sentence}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getButtonState = () => {
    switch (status) {
      case AppStatus.IDLE:
      case AppStatus.ERROR:
        return { text: 'Start Transcribing', color: 'bg-cyan-500 hover:bg-cyan-600', disabled: !!modelLoading };
      case AppStatus.LOADING_MODEL:
        return { text: 'Loading Model...', color: 'bg-gray-500', disabled: true };
      case AppStatus.STARTING_CAMERA:
        return { text: 'Starting Camera...', color: 'bg-gray-500', disabled: true };
      case AppStatus.TRANSCRIBING:
        return { text: 'Stop Transcribing', color: 'bg-red-500 hover:bg-red-600', disabled: false };
      default:
        return { text: 'Start', color: 'bg-cyan-500 hover:bg-cyan-600', disabled: true };
    }
  };
  
  const buttonState = getButtonState();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
      {/* FIX: Render the ASL and SASL guide modals. */}
      <ASLAlphabetGuide isOpen={isASLGuideOpen} onClose={() => setIsASLGuideOpen(false)} />
      <SASLAlphabetGuide isOpen={isSASLGuideOpen} onClose={() => setIsSASLGuideOpen(false)} />
      <header className="w-full max-w-5xl mx-auto flex items-center justify-center sm:justify-start gap-4 mb-6">
        <HandIcon className="w-10 h-10 text-cyan-400" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Sign Language Transcriber
        </h1>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2 flex flex-col bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden border border-gray-700">
          <div className="p-4 bg-gray-900/50 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-center">Camera Feed</h2>
          </div>
          <div className="relative aspect-video flex-grow flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
             {status !== AppStatus.TRANSCRIBING && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center">
                <HandIcon className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  {status === AppStatus.IDLE && "Camera is off. Press 'Start' to begin."}
                  {status === AppStatus.LOADING_MODEL && "Preparing hand recognition model..."}
                  {status === AppStatus.STARTING_CAMERA && "Initializing camera..."}
                  {status === AppStatus.ERROR && (error || "Camera not available.")}
                </p>
              </div>
            )}
            {status === AppStatus.TRANSCRIBING && (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden border border-gray-700">
          <div className="p-4 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-center flex-grow">Live Transcription</h2>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsSASLGuideOpen(true)}
                    className="px-3 py-1 text-sm font-bold text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Open South African Sign Language Guide"
                >
                    SASL
                </button>
                <button
                    onClick={() => setIsASLGuideOpen(true)}
                    className="p-1 text-gray-400 hover:text-cyan-300 transition-colors duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Open ASL Alphabet Guide"
                >
                    <BookOpenIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
          <div className="p-6 flex-grow flex flex-col justify-start min-h-[280px] relative">
             {transcriptionError && (
              <div className="absolute top-2 right-2 left-2 flex items-center justify-center text-yellow-300 bg-yellow-900/60 rounded-md m-2 p-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm">{transcriptionError}</p>
              </div>
            )}
            <div className={`flex-grow transition-opacity duration-300 ${transcriptionError ? 'opacity-20' : 'opacity-100'}`}>
                {sentence ? (
                    <p className="text-xl leading-relaxed whitespace-pre-wrap font-sans text-cyan-200">
                        {sentence}
                        {isProcessingFrame.current && !transcriptionError && status === AppStatus.TRANSCRIBING && <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1" />}
                    </p>
                ) : (
                    <p className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Your transcribed sentence will appear here...
                    </p>
                )}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto mt-6 flex flex-col items-center gap-4">
        {error && status === AppStatus.ERROR && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-center">
                <strong>Error:</strong> {error}
            </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleToggleCamera}
              disabled={buttonState.disabled}
              className={`px-8 py-4 w-full sm:w-auto text-xl font-bold text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${buttonState.color} ${buttonState.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {buttonState.text}
            </button>
             <button
                onClick={handleClear}
                disabled={!sentence}
                className="px-6 py-3 w-full sm:w-auto text-lg font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Clear Text
            </button>
        </div>
        <div className="flex items-center justify-center gap-4 w-full sm:w-auto mt-2">
            <button
                onClick={handleDownloadTranscript}
                disabled={!sentence}
                className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <DownloadIcon className="w-4 h-4" />
                Transcript
            </button>
            {videoUrl && (
                <a
                  href={videoUrl}
                  download="transcription-video.webm"
                  className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-cyan-600/50 hover:bg-cyan-600 border border-cyan-500 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400"
              >
                  <DownloadIcon className="w-4 h-4" />
                  Video
              </a>
            )}
        </div>
        <div className="w-full max-w-sm flex flex-col items-center gap-2 pt-4">
          <label htmlFor="transcription-speed" className="text-sm font-medium text-gray-300">
            Transcription Speed: <span className="font-bold text-cyan-400">{(transcriptionInterval / 1000).toFixed(1)}s</span>
          </label>
          <input
            id="transcription-speed"
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={transcriptionInterval}
            onChange={(e) => setTranscriptionInterval(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-cyan-400 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:hover:bg-cyan-400"
            aria-label="Transcription Speed Slider"
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
