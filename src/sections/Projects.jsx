import { AsciiCover } from '../components/AsciiCover.jsx';
import { Screen, SectionHead, StepLog, useActive, pad } from '../components/Section.jsx';
import { ScrambleText } from '../components/ScrambleText.jsx';
import { archive, featured } from '../content/projects/index.js';

export const openProject = (slug) => {
  window.location.hash = `/project/${slug}`;
};

// One featured project per step, with its picture in a small feed on the other side.
// The card links out to the project's first two links (just the first on phones).
export function Projects() {
  const { active, step, compact } = useActive('projects');
  const project = featured[step];
  const links = (project.links ?? []).filter((link) => link.url);
  return (
    <Screen id="projects" className="projects">
      <div className="col" data-fit data-block>
        <SectionHead id="projects" title="Projects" />
        <StepLog
          id="projects"
          step={step}
          items={featured.map((p) => ({ key: p.slug, name: p.title, meta: p.tags[0] }))}
        />
        <article className="detail reveal" style={{ '--i': 2 }} key={step}>
          <span className="detail__when">{project.role}</span>
          <ScrambleText as="h3" className="detail__title" text={project.title} play={active} delay={active ? 120 : 450} />
          <p className="detail__text">{project.summary}</p>
          <ul className="chips">
            {project.tags.map((tag) => <li className="chip" key={tag}>{tag}</li>)}
          </ul>
          <div className="detail__actions">
            <button className="button button--accent" onClick={() => openProject(project.slug)}>open project</button>
            {links.slice(0, compact ? 1 : 2).map((link) => (
              <a className="button" key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
            ))}
          </div>
        </article>
        {archive.length > 0 && (
          <p className="archive reveal" style={{ '--i': 3 }}>
            <span className="archive__label">archive ›</span>
            {archive.map((p) => (
              <button key={p.slug} onClick={() => openProject(p.slug)}>{p.title}</button>
            ))}
          </p>
        )}
      </div>

      <figure className="feed reveal" style={{ '--i': 3 }} data-block>
        <figcaption className="feed__bar">
          <span>visual feed · {pad(step + 1)}</span>
          <span className="feed__live">live</span>
        </figcaption>
        <div className="feed__screen" key={project.slug}>
          {project.cover ? <img src={project.cover} alt="" /> : <AsciiCover seed={project.slug} />}
        </div>
      </figure>
    </Screen>
  );
}
