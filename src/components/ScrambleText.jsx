import { useEffect, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&@$01';

// Text that decodes out of random glyphs every time play turns true.
export function ScrambleText({ text, play = true, delay = 450, duration = 700, as: Tag = 'span', ...rest }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!play || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text);
      return undefined;
    }
    let frame;
    let start;
    const tick = (now) => {
      start ??= now + delay;
      const progress = Math.max(0, Math.min((now - start) / duration, 1));
      const settled = Math.floor(progress * text.length);
      setShown([...text].map((char, i) => (
        i < settled || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      )).join(''));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, play, delay, duration]);

  return (
    <Tag aria-label={text} {...rest}>
      <span aria-hidden="true">{shown}</span>
    </Tag>
  );
}
