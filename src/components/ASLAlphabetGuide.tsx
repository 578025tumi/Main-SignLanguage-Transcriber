import React from 'react';

interface ASLAlphabetGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const aslSignStyles = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "w-full h-full"
} as const;

// A dictionary of SVG elements representing ASL hand signs for each letter
const aslSigns: Record<string, React.ReactElement> = {
  'A': <svg {...aslSignStyles}><path d="M12.5 11.5c-2.5-1-4.5 1.5-4.5 4v1h9v-1c0-2.5-2-5-4.5-4z" /><path d="M7 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M11.2 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M15.4 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8" /><path d="M6.5 12H4.8c-.7 0-1.3.6-1.3 1.3v2.4c0 .7.6 1.3 1.3 1.3h1.7" /></svg>,
  'B': <svg {...aslSignStyles}><path d="M6 16.5V6.8c0-1 .8-1.8 1.8-1.8h0c1 0 1.8.8 1.8 1.8v9.7m3.6 0V6.8c0-1 .8-1.8 1.8-1.8h0c1 0 1.8.8 1.8 1.8v9.7m3.6 0V6.8c0-1 .8-1.8 1.8-1.8h0c1 0 1.8.8 1.8 1.8v9.7m3.6 0V7.8c0-1-.8-1.8-1.8-1.8h0c-1 0-1.8.8-1.8 1.8v8.7" /><path d="M5 13.5c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v2c0 1.7-1.3 3-3 3H8c-1.7 0-3-1.3-3-3v-2z" /><path d="M5.5 12.5L2 15l3.5 2.5" /></svg>,
  'C': <svg {...aslSignStyles}><path d="M11 5c-3.3 0-6 2.7-6 6s2.7 6 6 6h6" /><path d="M11 5c3.3 0 6 2.7 6 6s-2.7 6-6 6" /><path d="M21 11c0 3.3-2.7 6-6 6h- архитек" /><path d="M5 11c0-3.3 2.7-6 6-6v0c3.3 0 6 2.7 6 6" /><path d="M12.5 17.5c-2.5 2.5-6.5 2.5-9 0s-2.5-6.5 0-9" /><path d="M12.5 6.5c2.5-2.5 6.5-2.5 9 0s2.5 6.5 0 9" /></svg>,
  'D': <svg {...aslSignStyles}><path d="M9 13.5a4.5 4.5 0 109 0a4.5 4.5 0 10-9 0" /><path d="M13.5 13.5H18c1.7 0 3-1.3 3-3V8.8c0-.4-.3-.8-.8-.8h-1.4c-.4 0-.8.3-.8.8v1.7c0 1.1-.9 2-2 2h-4.5" /><path d="M13.5 4v5" /><path d="M12 18H9.5c-1.4 0-2.5-1.1-2.5-2.5v-1c0-1.4 1.1-2.5 2.5-2.5H12" /></svg>,
  'E': <svg {...aslSignStyles}><path d="M7 16V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16m4-1.6V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16m4-1.6V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16" /><path d="M7 11.5c-1.7-1-3.5 1-3.5 3v1h18v-1c0-2-1.8-4-3.5-3" /><path d="M3.5 15.5h18" /></svg>,
  'F': <svg {...aslSignStyles}><path d="M11.5 11.5a2.5 2.5 0 00-5 0 2.5 2.5 0 005 0z" /><path d="M9 11.5V5" /><path d="M13 5v12m4-12v12m4-12v12" /></svg>,
  'G': <svg {...aslSignStyles}><path d="M11 11H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h6" /><path d="M11 15H5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h6" /><path d="M15 11v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2" /><path d="M15 15v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2" /><path d="M11 11v4" /><path d="M7 5v10" /></svg>,
  'H': <svg {...aslSignStyles}><path d="M10 5v10m4-10v10" /><path d="M18 10h-2.5c-1.4 0-2.5-1.1-2.5-2.5v0c0-1.4 1.1-2.5 2.5-2.5H18" /><path d="M18 15h-2.5c-1.4 0-2.5-1.1-2.5-2.5v0c0-1.4 1.1-2.5 2.5-2.5H18" /><path d="M6 10h2.5C9.9 10 11 8.9 11 7.5v0C11 6.1 9.9 5 8.5 5H6" /><path d="M6 15h2.5c1.4 0 2.5-1.1 2.5-2.5v0c0-1.4-1.1-2.5-2.5-2.5H6" /></svg>,
  'I': <svg {...aslSignStyles}><path d="M8 15c-1.7-1-3 1-3 3v1h14v-1c0-2-1.3-4-3-3" /><path d="M17 5v4" /><path d="M8 15h8" /></svg>,
  'J': <svg {...aslSignStyles}><path d="M17 5v5c0 3.3-2.7 6-6 6H8" /><path d="M8 15c-1.7-1-3 1-3 3v1h11" /></svg>,
  'K': <svg {...aslSignStyles}><path d="M9 5v12m4-12v5" /><path d="M13 10l5-5" /><path d="M13 10l5 5" /><path d="M8 15c-1.7-1-3 1-3 3v1h10" /></svg>,
  'L': <svg {...aslSignStyles}><path d="M13 5v12" /><path d="M13 17h5" /><path d="M8 15c-1.7-1-3 1-3 3v1h8" /></svg>,
  'M': <svg {...aslSignStyles}><path d="M7 16V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16m4-1.6V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16m4-1.6V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16" /><path d="M7 11.5c-1.7-1-3.5 1-3.5 3v1h18v-1c0-2-1.8-4-3.5-3" /></svg>,
  'N': <svg {...aslSignStyles}><path d="M7 16V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16m4-1.6V9.4c0-1.3 1.1-2.4 2.4-2.4h0c1.3 0 2.4 1.1 2.4 2.4V16" /><path d="M7 11.5c-1.7-1-3.5 1-3.5 3v1h12v-1c0-2-1.8-4-3.5-3" /></svg>,
  'O': <svg {...aslSignStyles}><ellipse cx="12" cy="11" rx="5" ry="6" /><path d="M12 17v2" /><path d="M12 3v2" /><path d="M17 11h2" /><path d="M5 11h2" /><path d="M12.5 17.5c-2.5 2.5-6.5 2.5-9 0s-2.5-6.5 0-9" /><path d="M12.5 6.5c2.5-2.5 6.5-2.5 9 0s2.5 6.5 0 9" /></svg>,
  'P': <svg {...aslSignStyles}><path d="M9 19V7m4 12V7" /><path d="M13 12l5-5" /><path d="M13 12l5 5" /><path d="M8 15c-1.7-1-3 1-3 3v1h10" /></svg>,
  'Q': <svg {...aslSignStyles}><path d="M11 13H5c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h6" /><path d="M11 17H5c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h6" /><path d="M15 13v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2" /><path d="M15 17v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2" /><path d="M11 13v4" /><path d="M7 7v10" /><path d="M14 20l2-2" /></svg>,
  'R': <svg {...aslSignStyles}><path d="M9 5v12m4-12v12" /><path d="M9 8l4-3m0 3l-4-3" /><path d="M8 15c-1.7-1-3 1-3 3v1h10" /></svg>,
  'S': <svg {...aslSignStyles}><path d="M12.5 11.5c-2.5-1-4.5 1.5-4.5 4v1h9v-1c0-2.5-2-5-4.5-4z" /><path d="M7 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M11.2 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M15.4 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8" /><path d="M10 11H8c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2" /></svg>,
  'T': <svg {...aslSignStyles}><path d="M12.5 11.5c-2.5-1-4.5 1.5-4.5 4v1h9v-1c0-2.5-2-5-4.5-4z" /><path d="M9.1 8.4c.8-.9 2-.9 2.8 0" /><path d="M7 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M11.2 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8M15.4 15.2V8.4c0-1.2.9-2.1 2.1-2.1h0c1.2 0 2.1.9 2.1 2.1v6.8" /></svg>,
  'U': <svg {...aslSignStyles}><path d="M9 5v12m4-12v12" /><path d="M8 15c-1.7-1-3 1-3 3v1h10" /></svg>,
  'V': <svg {...aslSignStyles}><path d="M9 5v7m6-7v7" /><path d="M9 12l3 5 3-5" /><path d="M8 15c-1.7-1-3 1-3 3v1h10" /></svg>,
  'W': <svg {...aslSignStyles}><path d="M8 5v7m4-7v7m4-7v7" /><path d="M8 12l2 5 2-5m2 0l2 5 2-5" /><path d="M7 15c-1.7-1-3 1-3 3v1h12" /></svg>,
  'X': <svg {...aslSignStyles}><path d="M9 5v3c0 1.7 1.3 3 3 3h0" /><path d="M8 15c-1.7-1-3 1-3 3v1h14v-1c0-2-1.3-4-3-3" /></svg>,
  'Y': <svg {...aslSignStyles}><path d="M17 5v5" /><path d="M7 5v5" /><path d="M7 10c0 2.8 2.2 5 5 5s5-2.2 5-5" /><path d="M8 15h8" /></svg>,
  'Z': <svg {...aslSignStyles}><path d="M7 7h10l-10 10h10" /><path d="M8 15c-1.7-1-3 1-3 3v1h14v-1c0-2-1.3-4-3-3" /></svg>,
};


const ASLAlphabetGuide: React.FC<ASLAlphabetGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asl-guide-title"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700 transform transition-transform duration-300 scale-95"
        style={isOpen ? { opacity: 1, transform: 'scale(1)' } : { opacity: 0, transform: 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-700 sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10">
          <h2 id="asl-guide-title" className="text-xl font-bold text-white">ASL Alphabet Guide</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close alphabet guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 text-center">
            {alphabet.map((letter) => (
              <div key={letter} className="flex flex-col items-center p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="w-full aspect-square bg-gray-700/50 rounded-md flex items-center justify-center mb-2 text-gray-400 p-2" aria-label={`ASL sign for ${letter}`}>
                  {aslSigns[letter] || <span className="text-3xl font-bold text-gray-500 select-none" aria-hidden="true">{letter}</span>}
                </div>
                <p className="font-mono text-lg text-cyan-300">{letter}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASLAlphabetGuide;
