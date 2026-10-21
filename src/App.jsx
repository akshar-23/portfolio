import { useEffect, useRef, useState } from 'react';
import { Nav } from './components/Nav.jsx';
import { ProjectOverlay } from './components/ProjectOverlay.jsx';
import { profile } from './content/site.js';
import { About } from './sections/About.jsx';
import { Contact } from './sections/Contact.jsx';
import { Experience } from './sections/Experience.jsx';
import { Hero } from './sections/Hero.jsx';
import { Projects } from './sections/Projects.jsx';
import { Research } from './sections/Research.jsx';
import { Skills } from './sections/Skills.jsx';

const projectFromHash = () => window.location.hash.match(/^#\/project\/([\w-]+)/)?.[1] ?? null;

export function App() {
  const [active, setActive] = useState('top');
  const [slug, setSlug] = useState(projectFromHash);
  const current = useRef(slug);
  // false when the page was loaded straight onto a project (closing can't go back then)
  const openedHere = useRef(false);

  // which project is open lives in the url, so links and the back button work
  useEffect(() => {
    const sync = () => {
      const next = projectFromHash();
      if (next && !current.current) openedHere.current = true;
      current.current = next;
      setSlug(next);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    // fade sections in as they arrive
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

    // highlight the section in the middle of the screen
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-station]').forEach((el) => spy.observe(el));

    return () => {
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  return (
    <>
      <a className="visually-hidden" href="#about">Skip to content</a>
      <Nav active={active} />
      <main>
        <Hero />
        <About />
        <Experience />
        <Research />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <footer className="footer label">
        <span>© {new Date().getFullYear()} {profile.firstName} {profile.lastName}</span>
        <span>rendered in ascii with three.js</span>
        <a href="#top">back to top ↑</a>
      </footer>
      <ProjectOverlay slug={slug} openedHere={openedHere.current} />
    </>
  );
}
