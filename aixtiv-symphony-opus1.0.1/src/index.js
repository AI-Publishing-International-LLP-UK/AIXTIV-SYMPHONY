/**
 * Polyfill imports from core-js
 * These provide cross-browser compatibility for modern JavaScript features
 * Ensures the application works consistently across different browser environments
 * Import order matters - polyfills should be loaded before application code
 */
import 'core-js/stable'; // Provides polyfills for ECMAScript features
import 'core-js/features/array/flat'; // Polyfill for Array.prototype.flat
import 'core-js/features/array/includes'; // Polyfill for Array.prototype.includes
import 'core-js/features/object/entries'; // Polyfill for Object.entries
import 'core-js/features/object/from-entries'; // Polyfill for Object.fromEntries
import 'core-js/features/promise'; // Enhanced Promise polyfill
import 'core-js/features/string/pad-start'; // Polyfill for String.prototype.padStart
import 'core-js/features/string/pad-end'; // Polyfill for String.prototype.padEnd
import 'core-js/features/symbol'; // Polyfill for Symbol
import 'core-js/features/map'; // Polyfill for Map
import 'core-js/features/set'; // Polyfill for Set

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css';

/**
 * Entry point for the ASOOS Symphony Opus 1.0.1 application
 * Renders the main App component into the root DOM element
 */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

