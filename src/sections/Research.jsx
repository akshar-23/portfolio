import { PixelIcon } from '../components/PixelIcon.jsx';
import { Screen, SectionHead } from '../components/Section.jsx';
import { profile, research } from '../content/site.js';

const ICONS = ['grid', 'blend', 'solve'];

function Paper({ paper, i }) {
  const title = paper.url
    ? <a href={paper.url} target="_blank" rel="noreferrer">{paper.title} ↗</a>
    : paper.title;
  return (
    <li className="orbit__item reveal" style={{ '--i': i + 2 }} data-block>
      <PixelIcon name={ICONS[i]} />
      <span className="orbit__venue">[{String(i + 1).padStart(2, '0')}] {paper.venue} · {paper.author}</span>
      <h3>{title}</h3>
      <p>{paper.summary}</p>
    </li>
  );
}

// The papers sit in two columns around the gas giant in the middle.
export function Research() {
  const scholar = profile.links.find((link) => link.label === 'Scholar');
  const [first, second, third] = research.papers;
  return (
    <Screen id="research" className="research">
      <SectionHead id="research" title="Research" className="research__head" />
      <div className="orbit" data-scroll>
        <ol className="orbit__side orbit__side--left">
          <Paper paper={first} i={0} />
          <Paper paper={second} i={1} />
        </ol>
        <ol className="orbit__side orbit__side--right" start={3}>
          <Paper paper={third} i={2} />
          <li className="orbit__item reveal" style={{ '--i': 5 }} data-block>
            <PixelIcon name="lab" />
            <span className="orbit__venue">game design lab · northeastern</span>
            <p>{research.intro}</p>
            {scholar?.url && (
              <a className="button button--accent" href={scholar.url} target="_blank" rel="noreferrer">google scholar ↗</a>
            )}
          </li>
        </ol>
      </div>
    </Screen>
  );
}
