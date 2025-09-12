import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: The bundler has trouble resolving './App'. Specifying the extension helps fix the "no default export" error.
import App from './App.tsx';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
