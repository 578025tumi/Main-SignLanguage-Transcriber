import { useState, useEffect } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const useHandLandmarker = () => {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const createHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2, // Allow detection of two hands
        });
        setHandLandmarker(landmarker);
      } catch (e) {
        console.error('Failed to create HandLandmarker:', e);
        setError('Failed to load hand landmark model. Your browser might not be supported, or there could be a network issue.');
      } finally {
        setLoading(false);
      }
    };

    createHandLandmarker();
  }, []);

  return { handLandmarker, loading, error };
};
