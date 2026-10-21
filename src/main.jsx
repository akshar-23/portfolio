import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/martian-mono/standard.css';
import '@fontsource-variable/space-grotesk';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/project.css';
import { App } from './App.jsx';
import { startScene } from './scene/index.js';

// always start at the top
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// the background reads the sections' positions, so start it once they are on the page
requestAnimationFrame(() => startScene(document.getElementById('bg')));
