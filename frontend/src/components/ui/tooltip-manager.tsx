'use client';

import { useEffect, useState, useRef } from 'react';

interface TooltipState {
  text: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
}

export function TooltipManager() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[data-toggle="tooltip"]') as HTMLElement | null;
      if (!target) return;

      const title = target.getAttribute('title') || target.getAttribute('data-original-title');
      if (!title || !title.trim()) return;

      // Suppress native OS browser tooltip by caching title in data-original-title
      if (target.hasAttribute('title')) {
        target.setAttribute('data-original-title', title);
        target.removeAttribute('title');
      }

      activeTargetRef.current = target;

      const placement = (target.getAttribute('data-placement') || 'bottom') as 'top' | 'bottom' | 'left' | 'right';
      const rect = target.getBoundingClientRect();

      let x = rect.left + rect.width / 2;
      let y = rect.bottom;

      if (placement === 'top') {
        y = rect.top;
      } else if (placement === 'bottom') {
        y = rect.bottom;
      } else if (placement === 'left') {
        x = rect.left;
        y = rect.top + rect.height / 2;
      } else if (placement === 'right') {
        x = rect.right;
        y = rect.top + rect.height / 2;
      }

      setTooltip({
        text: title,
        placement,
        x: x + window.scrollX,
        y: y + window.scrollY,
      });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[data-toggle="tooltip"]') as HTMLElement | null;
      if (target && target === activeTargetRef.current) {
        const origTitle = target.getAttribute('data-original-title');
        if (origTitle && !target.hasAttribute('title')) {
          target.setAttribute('title', origTitle);
        }
      }
      activeTargetRef.current = null;
      setTooltip(null);
    };

    const handleDismiss = () => {
      if (activeTargetRef.current) {
        const origTitle = activeTargetRef.current.getAttribute('data-original-title');
        if (origTitle && !activeTargetRef.current.hasAttribute('title')) {
          activeTargetRef.current.setAttribute('title', origTitle);
        }
      }
      activeTargetRef.current = null;
      setTooltip(null);
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleDismiss, true);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('click', handleDismiss, true);
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss, true);
    };
  }, []);

  if (!tooltip) return null;

  let transformStyle = '';
  if (tooltip.placement === 'bottom') {
    transformStyle = 'translate(-50%, 6px)';
  } else if (tooltip.placement === 'top') {
    transformStyle = 'translate(-50%, calc(-100% - 6px))';
  } else if (tooltip.placement === 'left') {
    transformStyle = 'translate(calc(-100% - 6px), -50%)';
  } else if (tooltip.placement === 'right') {
    transformStyle = 'translate(6px, -50%)';
  }

  return (
    <div
      className={`tooltip bs-tooltip-${tooltip.placement} show`}
      role="tooltip"
      style={{
        position: 'absolute',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: transformStyle,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      <div className="arrow" />
      <div className="tooltip-inner">{tooltip.text}</div>
    </div>
  );
}
