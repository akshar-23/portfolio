import { Children, useEffect, useId, useState } from 'react';

// Blocks you can use inside a project's index.mdx. See projects/_template/index.mdx.

function Caption({ children }) {
  return children ? <figcaption className="label">{children}</figcaption> : null;
}

// <Video src={clip} poster={still} />, <Video youtube="VIDEO_ID" /> or <Video vimeo="VIDEO_ID" />
export function Video({ src, poster, youtube, vimeo, caption, ratio = '16 / 9', autoplay = false }) {
  const embed = youtube
    ? `https://www.youtube-nocookie.com/embed/${youtube}`
    : vimeo && `https://player.vimeo.com/video/${vimeo}`;
  return (
    <figure className="media">
      <div className="frame frame--ratio" style={{ '--ratio': ratio }}>
        {embed ? (
          <iframe src={embed} title={caption ?? 'Video'} loading="lazy" allow="fullscreen; picture-in-picture" />
        ) : (
          <video
            src={src}
            poster={poster}
            controls={!autoplay}
            autoPlay={autoplay}
            muted={autoplay}
            loop={autoplay}
            playsInline
            preload="metadata"
          />
        )}
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

// <Gallery images={[{ src: shot1, alt: 'Main menu' }, ...]} />
// ratio: the shape of the thumbnails, like '9 / 19' for phone screenshots
export function Gallery({ images = [], caption, ratio }) {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (open === null) return undefined;
    const keys = (event) => {
      if (event.key === 'Escape') setOpen(null);
      if (event.key === 'ArrowRight') setOpen((i) => (i + 1) % images.length);
      if (event.key === 'ArrowLeft') setOpen((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [open, images.length]);

  return (
    <figure className="media">
      <div className={`gallery${ratio ? ' gallery--tall' : ''}`} style={ratio ? { '--ratio': ratio } : undefined}>
        {images.map((image, i) => (
          <button key={image.src} onClick={() => setOpen(i)} aria-label={`Enlarge ${image.alt ?? `image ${i + 1}`}`}>
            <img src={image.src} alt={image.alt ?? ''} loading="lazy" />
          </button>
        ))}
      </div>
      <Caption>{caption}</Caption>
      {open !== null && (
        <div className="lightbox" role="dialog" aria-label="Image" onClick={() => setOpen(null)}>
          <img src={images[open].src} alt={images[open].alt ?? ''} />
        </div>
      )}
    </figure>
  );
}

// <Compare before={oldShot} after={newShot} labels={['before', 'after']} />
export function Compare({ before, after, labels = ['before', 'after'], caption, ratio = '16 / 9' }) {
  const [split, setSplit] = useState(50);
  return (
    <figure className="media">
      <div className="frame compare" style={{ '--ratio': ratio, '--split': `${split}%` }}>
        <img src={before} alt={labels[0]} />
        <img className="compare__after" src={after} alt={labels[1]} />
        <span className="compare__line" />
        <input
          type="range"
          min="0"
          max="100"
          value={split}
          onChange={(event) => setSplit(Number(event.target.value))}
          aria-label={`Slide between ${labels[0]} and ${labels[1]}`}
        />
      </div>
      <div className="compare__labels label"><span>{labels[0]}</span><span>{labels[1]}</span></div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

// <Tabs><Tab label="Overview">...</Tab><Tab label="My role">...</Tab></Tabs>
export function Tab({ children }) {
  return children;
}

export function Tabs({ children }) {
  const tabs = Children.toArray(children).filter((child) => child.props?.label);
  const [current, setCurrent] = useState(0);
  const id = useId();
  return (
    <div className="media tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.props.label}
            className="tabs__tab"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === current}
            aria-controls={`${id}-panel`}
            onClick={() => setCurrent(i)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="tabs__panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${current}`}>
        {tabs[current]}
      </div>
    </div>
  );
}

// <Embed src="https://itch.io/embed-upload/..." title="Playable build" ratio="16 / 10" />
export function Embed({ src, title = 'Embedded content', ratio = '16 / 9', caption }) {
  return (
    <figure className="media">
      <div className="frame frame--ratio" style={{ '--ratio': ratio }}>
        <iframe src={src} title={title} loading="lazy" allowFullScreen />
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

// <Stats items={[{ value: '85%', label: 'tester satisfaction' }]} />
export function Stats({ items = [] }) {
  return (
    <div className="media stats">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// <Callout>Something worth pointing out.</Callout>
export function Callout({ children }) {
  return <div className="media callout">{children}</div>;
}

// open outside links in a new tab
function Link({ href = '', ...rest }) {
  const external = /^https?:/.test(href);
  return <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest} />;
}

export const mdxComponents = { Video, Gallery, Compare, Tabs, Tab, Embed, Stats, Callout, a: Link };
