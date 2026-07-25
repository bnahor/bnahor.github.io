import type { Variants } from 'framer-motion';

export const smooth = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const };
export const slow = { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const };

export function fadeUp(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { ...smooth, delay } },
  };
}

export function staggerContainer(stagger = 0.08): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger } },
  };
}

export const hoverLift = { y: -4 };
export const tapScale = { scale: 0.97 };
