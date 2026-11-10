import { useEffect } from 'react';

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The one curve for things settling into place. base.css has it as --ease. */
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/* ---------------------------------------------------------- disclosure -- */

const running = new WeakMap<HTMLElement, Animation>();

// Long panels take a little longer, so they appear to move at the same speed.
const durationFor = (distance: number) => Math.min(560, 260 + distance * 0.3);

function animateHeight(panel: HTMLElement, from: number, to: number, keyframes: Keyframe[] = []) {
  running.get(panel)?.cancel();
  const animation = panel.animate(
    keyframes.length ? keyframes : { height: [`${from}px`, `${to}px`] },
    { duration: durationFor(Math.abs(to - from)), easing: EASE },
  );
  running.set(panel, animation);
  return animation;
}

/** Content rises into an opening panel a beat behind its edge. */
function riseIn(items: Iterable<Element>) {
  let i = 0;
  for (const item of items) {
    item.animate(
      [
        { opacity: 0, transform: 'translateY(0.6rem)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 520, delay: 70 + i++ * 45, easing: EASE, fill: 'backwards' },
    );
  }
}

/**
 * Grows a panel to its natural height. The panel must already be displayed
 * (a details element open, a conditional body mounted). From closed it starts
 * at zero; caught mid-close it turns around from where it is.
 */
export function expand(panel: HTMLElement) {
  const from = panel.dataset.motion === 'closing' ? panel.getBoundingClientRect().height : 0;
  running.get(panel)?.cancel();
  if (prefersReducedMotion()) {
    panel.dataset.motion = 'open';
    return;
  }
  const to = panel.getBoundingClientRect().height;
  panel.dataset.motion = 'opening';
  const animation = animateHeight(panel, from, to);
  animation.onfinish = () => {
    running.delete(panel);
    panel.dataset.motion = 'open';
  };
  if (from === 0) {
    riseIn(panel.firstElementChild?.children ?? []);
    countUp(panel);
  }
}

/** Shrinks a panel to nothing, then calls `done` so the caller can hide it. */
export function collapse(panel: HTMLElement, done: () => void) {
  const from = panel.getBoundingClientRect().height;
  if (prefersReducedMotion() || from === 0) {
    running.get(panel)?.cancel();
    panel.dataset.motion = 'closed';
    done();
    return;
  }
  panel.dataset.motion = 'closing';
  const animation = animateHeight(panel, from, 0, [
    { height: `${from}px`, opacity: 1 },
    { height: '0px', opacity: 0 },
  ]);
  animation.onfinish = () => {
    running.delete(panel);
    panel.dataset.motion = 'closed';
    done();
  };
}

/* ------------------------------------------------------------- readouts -- */

/** Runs every `[data-count]` number in `root` up from zero, like a readout settling. */
export function countUp(root: ParentNode) {
  if (prefersReducedMotion()) return;
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    const final = el.dataset.count ?? '';
    const target = Number(final);
    if (!Number.isFinite(target)) continue;
    const places = final.split('.')[1]?.length ?? 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      el.textContent = (target * (1 - (1 - t) ** 4)).toFixed(places);
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = (0).toFixed(places);
    requestAnimationFrame(tick);
  }
}

/* -------------------------------------------------------------- reveals -- */

/**
 * Arms everything matching `selector` to reveal as it scrolls into view. The
 * hidden state only exists once armed, so without script, or with reduced
 * motion, nothing is ever hidden.
 */
export function useReveal(selector: string, key?: unknown) {
  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add('is-in');
          countUp(el);
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );

    for (const el of targets) {
      el.querySelectorAll<HTMLElement>('.roll > li').forEach((row, i) => {
        row.style.setProperty('--i', String(i));
      });
      el.classList.add('reveal');
      io.observe(el);
    }

    return () => {
      io.disconnect();
      for (const el of targets) el.classList.remove('reveal', 'is-in');
    };
  }, [selector, key]);
}

/* -------------------------------------------------------------- elastic -- */

const MAX_PULL = 110;

/** Past the edge, each extra pixel moves the page less: a rubber band. */
const rubber = (distance: number) =>
  Math.sign(distance) * MAX_PULL * (1 - 1 / (1 + (Math.abs(distance) * 0.55) / MAX_PULL));

/**
 * The page's own overscroll. The browser's is switched off in CSS (it showed
 * the bare document behind the page); this one pulls the content past the
 * top or bottom edge and springs it back, for wheel, trackpad and touch.
 */
export function useElastic(selector: string) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const targets = () => Array.from(document.querySelectorAll<HTMLElement>(selector));

    let pull = 0; // raw distance past the edge, before the rubber band
    let offset = 0; // what's drawn
    let lastInput = 0;
    let touching = false;
    let touchY = 0;
    let frame = 0;

    const atTop = () => window.scrollY <= 0;
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
    const locked = () => document.body.style.overflow === 'hidden';

    const paint = () => {
      const transform = offset ? `translate3d(0, ${offset.toFixed(2)}px, 0)` : '';
      for (const el of targets()) el.style.transform = transform;
    };

    const step = (now: number) => {
      frame = 0;
      // Let go (or the wheel went quiet): ease back to rest.
      if (!touching && now - lastInput > 90) pull *= 0.8;
      if (Math.abs(pull) < 0.3 && !touching) pull = 0;
      const next = rubber(pull);
      offset += (next - offset) * 0.35;
      if (Math.abs(offset - next) < 0.05) offset = next;
      paint();
      if (pull !== 0 || offset !== 0) frame = requestAnimationFrame(step);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (locked() || event.ctrlKey) return;
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if ((dy < 0 && atTop()) || (dy > 0 && atBottom()) || pull !== 0) {
        // Scrolling back the other way unwinds the pull faster than it built.
        pull -= dy * (dy * pull > 0 ? 1 : 0.6);
        if (pull * (atTop() ? 1 : -1) < 0) pull = 0;
        lastInput = performance.now();
        kick();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touching = true;
      touchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (locked()) return;
      const y = event.touches[0]?.clientY ?? touchY;
      const dy = y - touchY;
      touchY = y;
      if ((dy > 0 && atTop()) || (dy < 0 && atBottom()) || pull !== 0) {
        pull += dy;
        if ((atTop() && pull < 0) || (!atTop() && pull > 0)) pull = 0;
        lastInput = performance.now();
        kick();
      }
    };
    const onTouchEnd = () => {
      touching = false;
      kick();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      offset = 0;
      paint();
    };
  }, [selector]);
}
