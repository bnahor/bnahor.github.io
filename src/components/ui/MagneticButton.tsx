import { type ReactNode, type MouseEvent, useRef, useState, useCallback } from 'react';
import { m } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  href,
  download,
  target,
  rel,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  const motionProps = {
    ref: ref as React.RefObject<HTMLElement>,
    animate: { x: offset.x, y: offset.y },
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    className,
  };

  if (href) {
    return (
      <m.a
        {...motionProps}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        download={download}
        target={target}
        rel={rel}
      >
        {children}
      </m.a>
    );
  }

  return (
    <m.button
      {...motionProps}
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
    >
      {children}
    </m.button>
  );
}
