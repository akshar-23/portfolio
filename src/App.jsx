import { useEffect, useRef, useState } from 'react';
import { Hud } from './components/Hud.jsx';
import { GameHud } from './components/GameHud.jsx';
import { game, useGame } from './game/state.js';
import { ProjectOverlay } from './components/ProjectOverlay.jsx';
import { sections } from './content/site.js';
import { attachInput, journey } from './journey.js';
import { uiScale } from './scale.js';
import { fitContent } from './fit.js';
import { About } from './sections/About.jsx';
import { Contact } from './sections/Contact.jsx';
import { Experience } from './sections/Experience.jsx';
import { Hero } from './sections/Hero.jsx';
import { Projects } from './sections/Projects.jsx';
import { Research } from './sections/Research.jsx';
import { Skills } from './sections/Skills.jsx';

const projectFromHash = () => window.location.hash.match(/^#\/project\/([\w-]+)/)?.[1] ?? null;
const sectionFromHash = () => sections.find((s) => `#${s.id}` === window.location.hash)?.id ?? null;

export function App() {
  const [slug, setSlug] = useState(projectFromHash);
  const current = useRef(slug);
  // false when the page was loaded straight onto a project (closing can't go back then)
  const openedHere = useRef(false);

  // the url holds the section (#about) or the open project (#/project/<slug>)
  useEffect(() => {
    const sync = () => {
      const next = projectFromHash();
      if (next && !current.current) openedHere.current = true;
      current.current = next;
      setSlug(next);
      const section = sectionFromHash();
      if (section) journey.goTo(section);
    };
    sync();
    window.addEventListener('hashchange', sync);

    const toUrl = () => {
      if (projectFromHash()) return;
      const { id } = sections[journey.get().index];
      history.replaceState(null, '', id === 'top' ? window.location.pathname : `#${id}`);
    };
    const unsubscribe = journey.subscribe(toUrl);
    const detach = attachInput();
    return () => {
      window.removeEventListener('hashchange', sync);
      unsubscribe();
      detach();
    };
  }, []);

  const play = useGame();
  const playing = play.status !== 'off';
  useEffect(() => journey.lock(slug !== null || playing), [slug, playing]);

  // G starts the game, Esc leaves it
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.game = playing;
    const keys = (event) => {
      if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (event.key === 'Escape' && game.active) game.quit();
      else if ((event.key === 'g' || event.key === 'G') && !game.active && !projectFromHash()) game.start();
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [playing]);

  // the interface scale for big screens, and content fitted to the room it has
  useEffect(() => {
    const root = document.documentElement;
    const refit = () => {
      root.style.setProperty('--ui-zoom', uiScale());
      fitContent();
    };
    // after React has drawn the new step, and again once the scrambling titles settle
    const later = () => {
      requestAnimationFrame(refit);
      setTimeout(refit, 1400);
    };
    refit();
    const unsubscribe = journey.subscribe(later);
    window.addEventListener('resize', refit);
    document.fonts?.ready.then(refit);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', refit);
    };
  }, []);

  return (
    <>
      {playing ? <GameHud /> : <Hud />}
      <main>
        <Hero />
        <About />
        <Experience />
        <Research />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <ProjectOverlay slug={slug} openedHere={openedHere.current} />
    </>
  );
}
