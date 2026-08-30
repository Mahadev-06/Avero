'use client';

import { ElementType, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface TextShimmerWaveProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  zDistance?: number;
  xDistance?: number;
  yDistance?: number;
  scaleDistance?: number;
  rotateYDistance?: number;
  rotateXDistance?: number;
  style?: React.CSSProperties;
}

export function TextShimmerWave({
  children,
  as: Component = 'span',
  className,
  duration = 1,
  spread = 1,
  zDistance = 1,
  scaleDistance = 1.1,
  rotateYDistance = 20,
  rotateXDistance = 0,
  xDistance = 0,
  yDistance = -2,
  style,
}: TextShimmerWaveProps) {
  const letters = useMemo(() => children.split(''), [children]);

  return (
    <Component
      className={cn('inline-flex whitespace-pre [perspective:500px]', className)}
      style={{
        display: 'inline-flex',
        whiteSpace: 'pre',
        perspective: '500px',
        // @ts-expect-error CSS variable
        '--tsw-z': `${zDistance * 6}px`,
        '--tsw-scale': scaleDistance,
        '--tsw-rot-y': `${rotateYDistance}deg`,
        '--tsw-rot-x': `${rotateXDistance}deg`,
        '--tsw-y': `${yDistance}px`,
        '--tsw-x': `${xDistance}px`,
        ...style,
      }}
    >
      {letters.map((letter, i) => {
        const delay = (i * (duration / Math.max(letters.length, 1))) * spread;
        return (
          <span
            key={`tsw-${i}-${letter}`}
            className="inline-block text-shimmer-char"
            style={{
              animationDelay: `${delay.toFixed(3)}s`,
              animationDuration: `${duration}s`,
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        );
      })}
    </Component>
  );
}
