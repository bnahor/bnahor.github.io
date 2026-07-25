import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { outcomes, type Outcome } from '../data/highlights';

function AnimatedValue({ outcome }: { outcome: Outcome }) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? outcome.value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(outcome.value);
      return;
    }

    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(outcome.value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [outcome.value, reduceMotion]);

  return (
    <>
      {outcome.prefix}
      {value.toFixed(outcome.decimals ?? 0)}
      {outcome.suffix}
    </>
  );
}

export function OutcomeRail() {
  return (
    <section className="outcome-rail" aria-labelledby="signal-heading">
      <div className="outcome-rail-intro">
        <h2 id="signal-heading">What changed</h2>
        <p>Four recent results from capture, planning, and reliability work.</p>
      </div>

      <div className="outcome-list">
        {outcomes.map((outcome) => (
          <article key={outcome.label} className="outcome">
            <strong>
              <AnimatedValue outcome={outcome} />
            </strong>
            <span>{outcome.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
