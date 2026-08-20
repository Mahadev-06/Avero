"use client";

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "../../lib/utils";

interface ParallaxTextProps {
  text: string;
  className?: string;
  layers?: number;
}

export function ParallaxText({
  text = "Rankflow UI",
  className,
  layers = 5
}: ParallaxTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const normalizedX = (clientX / innerWidth) * 2 - 1;
      const normalizedY = (clientY / innerHeight) * 2 - 1;

      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const brutalistColors = [
    "text-amber-950",
    "text-orange-600",
    "text-amber-500",
    "text-yellow-300",
  ];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center isolate min-h-[400px] w-full overflow-hidden",
        className
      )}
    >
      <div className="relative group cursor-default">
        {Array.from({ length: layers }).map((_, i) => {
          const isTopLayer = i === layers - 1;
          const depth = (layers - 1) - i;
          const maxOffset = 8;

          const xTransform = useTransform(smoothX, [-1, 1], [maxOffset * depth, -maxOffset * depth]);
          const yTransform = useTransform(smoothY, [-1, 1], [maxOffset * depth, -maxOffset * depth]);

          const colorClass = isTopLayer ? "text-white" : brutalistColors[i % brutalistColors.length];

          return (
            <motion.div
              key={i}
              className={cn(
                "flex items-center justify-center font-black uppercase tracking-tighter text-6xl sm:text-7xl md:text-8xl",
                isTopLayer ? "relative z-10" : "absolute inset-0 z-0",
                colorClass
              )}
              style={{
                x: xTransform,
                y: yTransform,
                textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
              }}
            >
              {text}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
