import { useEffect, useRef, useState } from 'react';
import { Hud } from './components/Hud.jsx';
import { ProjectOverlay } from './components/ProjectOverlay.jsx';
import { sections } from './content/site.js';
import { attachInput, journey } from './journey.js';
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

  useEffect(() => journey.lock(slug !== null), [slug]);

  return (
    <>
      <Hud />
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
