import { type ReactNode, type MouseEvent, useRef, useState, useCallback } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function TiltCard({ children, className = '', intensity = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(600px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(600px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg)`);
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg)');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.15s ease-out' }}
      className={className}
    >
      {children}
    </div>
  );
}
