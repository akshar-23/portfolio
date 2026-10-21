import { useEffect, useState } from 'react';
import { profile, sections } from '../content/site.js';

export function Nav({ active }) {
  const [open, setOpen] = useState(false);
  const accent = sections.find((s) => s.id === active)?.accent;

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <nav className="nav" aria-label="Sections" style={{ '--accent': accent }}>
      <a className="nav__brand" href="#top">
        {profile.firstName[0]}<span>/</span>{profile.lastName[0]}
      </a>
      <button
        className="button nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen(!open)}
      >
        menu
      </button>
      <ul className="nav__links" id="nav-links" data-open={open}>
        {sections.slice(1).map((section, i) => (
          <li key={section.id}>
            <a
              className="nav__link"
              href={`#${section.id}`}
              aria-current={active === section.id}
              onClick={() => setOpen(false)}
            >
              <small>{String(i + 1).padStart(2, '0')}</small>{section.label}
            </a>
          </li>
        ))}
        <li>
          <a className="button button--accent" href={profile.resume} target="_blank" rel="noreferrer">resume</a>
        </li>
      </ul>
    </nav>
  );
}
