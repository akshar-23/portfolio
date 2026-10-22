import { Screen, SectionHead } from '../components/Section.jsx';
import { profile } from '../content/site.js';

export function Contact() {
  // after sending, formsubmit brings people back here
  const back = `${window.location.origin}${import.meta.env.BASE_URL}#contact`;

  return (
    <Screen id="contact" className="contact">
      <div className="col" data-fit data-block>
        <SectionHead id="contact" title="Open a channel" />
        <p className="contact__lead reveal" style={{ '--i': 1 }}>
          Working on games, tools or research where this could fit? Send a transmission, I read everything.
        </p>
        <a className="contact__email reveal" style={{ '--i': 2 }} href={`mailto:${profile.email}`}>{profile.email}</a>

        <form className="form reveal" style={{ '--i': 3 }} action="https://formsubmit.co/6ae7649013f806b5f13a504c48525a24" method="POST">
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_subject" value="New message from the portfolio" />
          <input type="hidden" name="_next" value={back} />
          <label className="field">
            <span>from</span>
            <input type="email" name="email" placeholder="you@domain.com" required />
          </label>
          <label className="field">
            <span>message</span>
            <textarea name="message" rows="3" placeholder="Let’s talk about…" required />
          </label>
          <button className="button button--accent" type="submit">transmit</button>
        </form>

        <ul className="socials reveal" style={{ '--i': 4 }}>
          {profile.links.filter((link) => link.url).map((link) => (
            <li key={link.label}><a href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a></li>
          ))}
          <li><a href={profile.resume} target="_blank" rel="noreferrer">Resume ↗</a></li>
        </ul>
      </div>
    </Screen>
  );
}
