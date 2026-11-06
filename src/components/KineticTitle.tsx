import { Fragment, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

type KineticTitleProps = {
  /** Each entry is one forced line. */
  lines: string[];
  className?: string;
  id?: string;
};

const WIDTH = { rest: 100, range: 25 };
const WEIGHT = { rest: 200, range: 620 };

/**
 * A heading whose letters gain width and weight as the cursor nears them. Mouse
 * only: on touch and with reduced motion it is plain type. It animates through
 * variable-font axes, so the only cost is the frames while a letter is moving.
 */
export function KineticTitle({ lines, className, id }: KineticTitleProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;

    const letters = Array.from(root.querySelectorAll<HTMLElement>('.kt-ch')).map((el) => ({
      el,
      x: 0,
      y: 0,
      value: 0,
      drawn: 0,
    }));
    let radius = 300;
    let px = -1e4;
    let py = -1e4;
    let frame = 0;

    const measure = () => {
      letters.forEach((letter) => {
        letter.el.style.fontVariationSettings = '';
        letter.drawn = 0;
        letter.value = 0;
      });
      const sy = window.scrollY;
      for (const letter of letters) {
        const rect = letter.el.getBoundingClientRect();
        letter.x = rect.left + rect.width / 2;
        letter.y = rect.top + rect.height / 2 + sy;
      }
      radius = Math.max(180, parseFloat(getComputedStyle(root).fontSize) * 1.9);
    };

    const tick = () => {
      frame = 0;
      const sy = window.scrollY;
      let moving = false;
      for (const letter of letters) {
        const d = Math.hypot(px - letter.x, py - (letter.y - sy));
        const u = Math.min(1, d / radius);
        const goal = 1 - u * u * (3 - 2 * u);
        letter.value += (goal - letter.value) * 0.14;
        if (Math.abs(goal - letter.value) > 0.004) moving = true;
        if (Math.abs(letter.value - letter.drawn) > 0.003) {
          letter.drawn = letter.value;
          letter.el.style.fontVariationSettings = `"wdth" ${(WIDTH.rest + WIDTH.range * letter.value).toFixed(1)}, "wght" ${(WEIGHT.rest + WEIGHT.range * letter.value).toFixed(0)}`;
        }
      }
      if (moving) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    measure();
    if (document.fonts?.ready) void document.fonts.ready.then(measure);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <h1
      ref={rootRef}
      id={id}
      className={`kinetic-title${className ? ` ${className}` : ''}`}
      aria-label={lines.join(' ')}
    >
      {lines.map((line) => (
        <span className="kt-line" aria-hidden="true" key={line}>
          {line.split(' ').map((word, w) => (
            <Fragment key={w}>
              {w > 0 && ' '}
              <span className="kt-word">
                {Array.from(word).map((ch, i) => (
                  <span className="kt-ch" key={i}>
                    {ch}
                  </span>
                ))}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </h1>
  );
}
