import { Section } from '../components/Section.jsx';
import { profile, research } from '../content/site.js';

export function Research() {
  const scholar = profile.links.find((link) => link.label === 'Scholar');
  return (
    <Section id="research" title="Research" align="right">
      <div className="panel reveal">
        <p className="research__intro">{research.intro}</p>
        <ol className="papers">
          {research.papers.map((paper) => (
            <li className="paper" key={paper.title}>
              <h3>
                {paper.url ? <a href={paper.url} target="_blank" rel="noreferrer">{paper.title} ↗</a> : paper.title}
              </h3>
              <div className="paper__meta">
                <span className="chip">{paper.venue}</span>
                <span className="chip">{paper.author}</span>
              </div>
              <p>{paper.summary}</p>
            </li>
          ))}
        </ol>
        {scholar?.url && (
          <a className="button button--accent" href={scholar.url} target="_blank" rel="noreferrer">google scholar ↗</a>
        )}
      </div>
    </Section>
  );
}
