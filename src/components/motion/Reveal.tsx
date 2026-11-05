import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { EASE_OUT } from './ease';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Rise distance in px. Zero gives a plain fade. */
  y?: number;
};

/**
 * Fades and lifts its children the first time they scroll into view. With
 * reduced motion, MotionConfig drops the transform and keeps the fade.
 */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  );
}
