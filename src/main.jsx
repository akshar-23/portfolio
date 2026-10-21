import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/tektur/standard.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/hud.css';
import './styles/sections.css';
import './styles/project.css';
import './styles/game.css';
import { App } from './App.jsx';
import { startScene } from './scene/index.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

startScene(document.getElementById('bg'));
