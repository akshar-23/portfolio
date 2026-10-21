import './style.css';
import { startScene } from './scene/index.js';

// load page at start
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
} else {
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }
}

startScene(document.querySelector('#bg'));
