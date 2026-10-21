import { NameTiles } from '../components/NameTiles.jsx';
import { profile } from '../content/site.js';

export function Hero() {
  return (
    <section id="top" className="hero" data-station style={{ '--accent': 'var(--rust)' }}>
      <div className="hero__inner">
        <p className="label hero__role reveal">// {profile.role}</p>
        <NameTiles words={[profile.firstName, profile.lastName]} />
        <p className="hero__tagline reveal">
          {profile.tagline} <strong>{profile.highlight}.</strong>
        </p>
        <p className="hero__now reveal">
          &gt; now: <b>{profile.now}</b><span className="cursor" aria-hidden="true" />
        </p>
        <div className="hero__actions reveal">
          <a className="button button--accent" href="#projects">view projects</a>
          <a className="button" href="#contact">get in touch</a>
          <a className="button" href={profile.resume} target="_blank" rel="noreferrer">resume ↗</a>
        </div>
      </div>
      <a className="hero__scroll label" href="#about">scroll</a>
    </section>
  );
}
