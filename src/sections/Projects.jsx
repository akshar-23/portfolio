import { AsciiCover } from '../components/AsciiCover.jsx';
import { Section } from '../components/Section.jsx';
import { archive, featured } from '../content/projects/index.js';

export const openProject = (slug) => {
  window.location.hash = `/project/${slug}`;
};

function Cover({ project }) {
  return project.cover
    ? <img src={project.cover} alt="" loading="lazy" />
    : <AsciiCover seed={project.slug} />;
}

export function Projects() {
  return (
    <Section id="projects" title="Projects" wide>
      <ul className="projects-grid">
        {featured.map((project) => (
          <li className="reveal" key={project.slug}>
            <button className="panel project-card" onClick={() => openProject(project.slug)}>
              <div className="project-card__cover"><Cover project={project} /></div>
              <div className="project-card__body">
                <span className="label">{project.role}</span>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <ul className="chips">
                  {project.tags.slice(0, 4).map((tag) => <li className="chip" key={tag}>{tag}</li>)}
                </ul>
                <span className="label project-card__more">open project →</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {archive.length > 0 && (
        <div className="archive panel reveal">
          <h3 className="label">// more projects</h3>
          <ul className="archive__list">
            {archive.map((project) => (
              <li key={project.slug}>
                <button className="archive__row" onClick={() => openProject(project.slug)}>
                  <strong>{project.title}</strong>
                  <span>{project.summary}</span>
                  <em className="label">open →</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
