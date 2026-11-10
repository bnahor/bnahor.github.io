import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { collapse, expand } from '../lib/motion';

type CollapseProps = {
  open: boolean;
  className: string;
  children: ReactNode;
};

/** A body that grows open and shrinks shut, and is unmounted while shut. */
export function Collapse({ open, className, children }: CollapseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (open) expand(panel);
    else collapse(panel, () => setMounted(false));
  }, [open]);

  if (!mounted) return null;
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
