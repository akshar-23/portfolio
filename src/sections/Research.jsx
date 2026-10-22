import { PixelIcon } from '../components/PixelIcon.jsx';
import { Screen, SectionHead, useActive } from '../components/Section.jsx';
import { profile, research } from '../content/site.js';

const ICONS = ['grid', 'blend', 'solve'];

function Paper({ paper, i, children, className = '' }) {
  return (
    <li className={`orbit__item reveal ${className}`} style={{ '--i': i + 2 }} data-block>
      <PixelIcon name={ICONS[i % ICONS.length]} />
      <span className="orbit__venue">[{String(i + 1).padStart(2, '0')}] {paper.venue}</span>
      <h3><a href={paper.url} target="_blank" rel="noreferrer">{paper.title} ↗</a></h3>
      <p>{paper.summary}</p>
      <span className="orbit__authors">{paper.authors}</span>
      {children}
    </li>
  );
}

// The papers hug the two edges of the screen; the gas giant sits between them. On
// compact screens it's one paper per step.
export function Research() {
  const { step, compact } = useActive('research');
  const scholar = profile.links.find((link) => link.label === 'Scholar');
  const half = Math.ceil(research.papers.length / 2);
  const last = research.papers.length - 1;
  const side = (papers, offset, className) => papers.map((paper, i) => (
    <Paper paper={paper} i={offset + i} key={paper.url} className={className}>
      {offset + i === last && scholar?.url && (
        <a className="button button--accent orbit__scholar" href={scholar.url} target="_blank" rel="noreferrer">google scholar ↗</a>
      )}
    </Paper>
  ));
  if (compact) {
    return (
      <Screen id="research" className="research">
        <div className="col" data-fit data-block>
          <SectionHead id="research" title="Research" />
          <ol className="orbit__single" start={step + 1}>
            {side([research.papers[step]], step, 'detail')}
          </ol>
        </div>
      </Screen>
    );
  }
  return (
    <Screen id="research" className="research">
      <SectionHead id="research" title="Research" className="research__head" />
      <div className="orbit" data-fit>
        <ol className="orbit__side orbit__side--left">{side(research.papers.slice(0, half), 0)}</ol>
        <ol className="orbit__side orbit__side--right" start={half + 1}>{side(research.papers.slice(half), half)}</ol>
      </div>
    </Screen>
  );
}
