"use client";

import * as React from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { AveroLogo } from "@/components/ui/avero-logo";

export interface ArcRevealHeroProps {
  /** How long the avero logo is held on screen (ms). Default: 650 */
  introHold?: number;
  /** Duration of the curved arc curtain reveal (ms). Default: 1100 */
  revealDuration?: number;
  /** Outer container class */
  className?: string;
  /** Content shown after the curtain reveal (the landing / page) */
  children?: React.ReactNode;
}

export function ArcRevealHero({
  introHold = 650,
  revealDuration = 1100,
  className,
  children,
}: ArcRevealHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<"intro" | "reveal" | "done">("intro");

  // Progress from 0 (curtain down, full black) to 1 (curtain up, website uncovered)
  const progress = useMotionValue(0);

  // Black curtain path: Covers top of viewport down to curved bottom edge.
  // When progress goes 0 -> 1, the curtain lifts upward, directly uncovering the website underneath.
  const curtainPath = useTransform(progress, (p: number) => {
    const edge = 115 - p * 150;
    const control = edge + 30;
    return `M 0 0 L 100 0 L 100 ${edge} Q 50 ${control} 0 ${edge} Z`;
  });

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setPhase("done");
      return;
    }
    const t = window.setTimeout(() => setPhase("reveal"), introHold);
    return () => window.clearTimeout(t);
  }, [prefersReducedMotion, introHold]);

  React.useEffect(() => {
    if (phase !== "reveal") return;
    const controls = animate(progress, 1, {
      duration: revealDuration / 1000,
      ease: [0.85, 0, 0.15, 1],
      onComplete: () => {
        setPhase("done");
      },
    });
    return () => controls.stop();
  }, [phase, progress, revealDuration]);

  const showOverlay = phase !== "done";

  return (
    <div className={cn("relative isolate w-full", className)}>
      {/* Live website rendered directly in background */}
      <div className="relative z-0">{children}</div>

      <AnimatePresence>
        {showOverlay && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              pointerEvents: phase === 'reveal' ? 'none' : 'auto',
              overflow: 'hidden',
            }}
          >
            {/* Rising Curved Black Curtain (reveals live site directly behind it) */}
            <svg
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <motion.path d={curtainPath} fill="#080808" />
            </svg>

            {/* Center AVERO Logo - Clean, pure white text logo without any background capsule */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <AnimatePresence mode="wait">
                {phase === "intro" && (
                  <motion.div
                    key="avero-intro-logo"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05, y: -15 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AveroLogo variant="white" height={36} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ArcRevealHero;
