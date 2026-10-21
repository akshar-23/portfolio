import { useEffect, useRef } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { projects } from '../content/projects/index.js';
import { sections } from '../content/site.js';
import { mdxComponents } from './media.jsx';

const accent = sections.find((s) => s.id === 'projects').accent;

// A project page over the background, at #/project/<slug>. Back, Escape or the close
// button return to the projects section.
export function ProjectOverlay({ slug, openedHere }) {
  const project = projects.find((p) => p.slug === slug);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    const opener = document.activeElement;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      root.style.overflow = '';
      opener?.focus?.({ preventScroll: true });
    };
  }, [project]);

  const close = () => {
    if (openedHere) {
      history.back();
    } else {
      history.replaceState(null, '', '#projects');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      requestAnimationFrame(() => document.getElementById('projects')?.scrollIntoView());
    }
  };

  useEffect(() => {
    if (!project) return undefined;
    const keys = (event) => event.key === 'Escape' && !document.querySelector('.lightbox') && close();
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });

  if (!project) return null;
  const { Content } = project;
  const links = (project.links ?? []).filter((link) => link.url);

  return (
    <div className="overlay" style={{ '--accent': accent }} onClick={(event) => event.target === event.currentTarget && close()}>
      <article className="panel overlay__panel" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <button ref={closeButton} className="button overlay__close" onClick={close}>close</button>
        <header className="project__head">
          <span className="label">// {project.role}</span>
          <h1 id="project-title">{project.title}</h1>
          <p>{project.summary}</p>
          <div className="project__meta">
            <ul className="chips">
              {project.tags.map((tag) => <li className="chip" key={tag}>{tag}</li>)}
            </ul>
            {links.map((link) => (
              <a className="button button--accent" key={link.label} href={link.url} target="_blank" rel="noreferrer">
                {link.label} ↗
              </a>
            ))}
          </div>
        </header>
        {project.cover && (
          <figure className="project__cover"><img src={project.cover} alt="" /></figure>
        )}
        <div className="prose">
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </div>
      </article>
    </div>
  );
}
