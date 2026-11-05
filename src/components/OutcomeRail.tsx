import { useEffect, useRef, useState } from 'react';
import { m, useInView, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from './motion/ease';
import { Reveal } from './motion/Reveal';
import { outcomes, type Outcome } from '../data/highlights';

function AnimatedValue({ outcome }: { outcome: Outcome }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Count up when the number is actually on screen, not on page load.
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(reduceMotion ? outcome.value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(outcome.value);
      return;
    }
    if (!inView) return;

    const start = performance.now();
    const duration = 1400;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(outcome.value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [outcome.value, reduceMotion, inView]);

  return (
    <span ref={ref}>
      {outcome.prefix}
      {value.toFixed(outcome.decimals ?? 0)}
      {outcome.suffix}
    </span>
  );
}

export function OutcomeRail() {
  return (
    <section className="outcome-rail" aria-labelledby="signal-heading">
      <Reveal className="outcome-rail-intro" y={16}>
        <h2 id="signal-heading">What changed</h2>
        <p>Four recent results from capture, planning, and reliability work.</p>
      </Reveal>

      <div className="outcome-list">
        {outcomes.map((outcome, index) => (
          <m.article
            key={outcome.label}
            className="outcome"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.08 }}
          >
            <strong>
              <AnimatedValue outcome={outcome} />
            </strong>
            <span>{outcome.label}</span>
            <m.i
              className="outcome-sweep"
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.15 + index * 0.08 }}
            />
          </m.article>
        ))}
      </div>
    </section>
  );
}
