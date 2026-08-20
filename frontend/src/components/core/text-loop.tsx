'use client';
import {
  AnimatePresence,
  motion,
  Transition,
  Variants,
} from 'motion/react';
import React, { useState, useEffect, Children } from 'react';
import { cn } from '@/lib/utils';

export type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  onIndexChange?: (index: number) => void;
  trigger?: boolean;
  mode?: 'popLayout' | 'sync' | 'wait';
};

export function TextLoop({
  children,
  className,
  interval = 1.85,
  transition = {
    type: 'spring',
    stiffness: 450,
    damping: 32,
    mass: 0.8,
  },
  variants,
  onIndexChange,
  trigger = true,
  mode = 'popLayout',
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    if (!trigger || items.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((current) => {
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, interval * 1000);

    return () => clearInterval(intervalId);
  }, [items.length, interval, onIndexChange, trigger]);

  const defaultVariants: Variants = {
    initial: {
      y: '80%',
      rotateX: 85,
      opacity: 0,
      filter: 'blur(3px)',
    },
    animate: {
      y: '0%',
      rotateX: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: {
      y: '-80%',
      rotateX: -85,
      opacity: 0,
      filter: 'blur(3px)',
    },
  };

  return (
    <span
      className={cn('relative inline-flex whitespace-nowrap overflow-y-clip', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '800px',
        verticalAlign: 'baseline',
      }}
    >
      <AnimatePresence mode={mode} initial={false}>
        <motion.span
          key={currentIndex}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          variants={variants || defaultVariants}
          style={{ display: 'inline-block', transformOrigin: '50% 50%' }}
        >
          {items[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
