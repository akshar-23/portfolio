import { NameTiles } from '../components/NameTiles.jsx';
import { Screen } from '../components/Section.jsx';
import { journey } from '../journey.js';
import { profile } from '../content/site.js';

export function Hero() {
  return (
    <Screen id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__content" data-block data-fit>
          <p className="label hero__role reveal" style={{ '--i': 0 }}>{profile.role}</p>
          <div className="reveal" style={{ '--i': 1 }}>
            <NameTiles words={[profile.firstName, profile.lastName]} />
          </div>
          <p className="hero__tagline reveal" style={{ '--i': 2 }}>{profile.tagline}</p>
          <ul className="hero__stats reveal" style={{ '--i': 3 }}>
            {profile.stats.map((stat) => (
              <li key={stat.label}><b>{stat.value}</b><span className="label">{stat.label}</span></li>
            ))}
          </ul>
          <div className="hero__actions reveal" style={{ '--i': 4 }}>
            <button className="button button--accent" onClick={() => journey.goTo('projects')}>view projects</button>
            <button className="button" onClick={() => journey.goTo('contact')}>get in touch</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
