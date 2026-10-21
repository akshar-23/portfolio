import { useEffect, useRef, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&@$01';

// Text that decodes out of random glyphs the first time it scrolls into view.
export function ScrambleText({ text, as: Tag = 'span', duration = 900, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start;
      const tick = (now) => {
        start ??= now;
        const progress = Math.min((now - start) / duration, 1);
        const settled = Math.floor(progress * text.length);
        setShown([...text].map((char, i) => (
          i < settled || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        )).join(''));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <Tag ref={ref} aria-label={text} {...rest}>
      <span aria-hidden="true">{shown}</span>
    </Tag>
  );
}
