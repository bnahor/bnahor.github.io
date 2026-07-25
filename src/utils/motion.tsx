import { m, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { fadeUp, staggerContainer } from './motionPresets';

// --- ScrollReveal component ---
interface ScrollRevealProps {
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function ScrollReveal({ delay = 0, className, children }: ScrollRevealProps) {
  const prefersReduced = useReducedMotion();
  return (
    <m.div
      variants={fadeUp(delay)}
      initial={prefersReduced ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// --- StaggerGroup component ---
interface StaggerGroupProps {
  stagger?: number;
  className?: string;
  children: ReactNode;
}

export function StaggerGroup({ stagger = 0.08, className, children }: StaggerGroupProps) {
  const prefersReduced = useReducedMotion();
  return (
    <m.div
      variants={staggerContainer(stagger)}
      initial={prefersReduced ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </m.div>
  );
}
