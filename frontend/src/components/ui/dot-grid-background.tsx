"use client";

import React, { useEffect, useRef } from "react";

export interface DotGridBackgroundProps {
  /** Size of each dot in pixels */
  dotSize?: number;
  /** Gap between dots in pixels */
  gap?: number;
  /** Probability of a dot starting to blink [0, 1] */
  blinkProbability?: number;
  /** Speed at which dots fade in/out [0, 1] */
  blinkSpeed?: number;
  /** Base RGB color of the dots: [r, g, b] (default: subtle neumorphic gray [140, 140, 140]) */
  dotRgb?: [number, number, number];
  /** Glow RGB color when hovered: [r, g, b] (default: amber accent [245, 158, 11]) */
  glowRgb?: [number, number, number];
  /** Radius around the cursor where dots light up */
  cursorRadius?: number;
  /** Maximum additional opacity from cursor proximity */
  cursorStrength?: number;
  /** Additional CSS classes */
  className?: string;
  /** Optional inline style override */
  style?: React.CSSProperties;
}

export const DotGridBackground: React.FC<DotGridBackgroundProps> = ({
  dotSize = 1.2,
  gap = 18,
  blinkProbability = 0.006,
  blinkSpeed = 0.04,
  dotRgb = [140, 140, 140],
  glowRgb = [245, 158, 11], // Subtle amber accent matching Avero brand
  cursorRadius = 140,
  cursorStrength = 0.7,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dots: {
      x: number;
      y: number;
      opacity: number;
      targetOpacity: number;
      size: number;
      isStray?: boolean;
    }[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initDots(width, height);
    };

    const initDots = (width: number, height: number) => {
      dots = [];
      const cols = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);

      // Grid dots
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * gap;
          const y = j * gap;
          const initialOpacity = 0.04 + Math.random() * 0.12;

          dots.push({
            x,
            y,
            opacity: initialOpacity,
            targetOpacity: initialOpacity,
            size: dotSize * (0.85 + Math.random() * 0.3),
          });
        }
      }

      // Stray dots for organic look
      const strayCount = Math.floor(cols * rows * 0.03);
      for (let k = 0; k < strayCount; k++) {
        const initialOpacity = 0.06 + Math.random() * 0.14;
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          opacity: initialOpacity,
          targetOpacity: initialOpacity,
          size: dotSize * (0.6 + Math.random() * 0.4),
          isStray: true,
        });
      }
    };

    const [dr, dg, db] = dotRgb;
    const [gr, gg, gb] = glowRgb;

    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        if (Math.random() < blinkProbability) {
          dot.targetOpacity = Math.random() > 0.6 ? 0.35 + Math.random() * 0.25 : 0.04 + Math.random() * 0.08;
        }

        dot.opacity += (dot.targetOpacity - dot.opacity) * blinkSpeed;

        const dx = dot.x - mx;
        const dy = dot.y - my;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let highlightLevel = 0;
        if (distance < cursorRadius) {
          highlightLevel = (1 - distance / cursorRadius) * cursorStrength;
        }

        const finalOpacity = Math.min(0.95, dot.opacity + highlightLevel);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size + (highlightLevel > 0 ? highlightLevel * 0.5 : 0), 0, Math.PI * 2);

        if (highlightLevel > 0) {
          const r = Math.round(dr + (gr - dr) * highlightLevel);
          const g = Math.round(dg + (gg - dg) * highlightLevel);
          const b = Math.round(db + (gb - db) * highlightLevel);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
        } else {
          ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${finalOpacity})`;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotSize, gap, blinkProbability, blinkSpeed, cursorRadius, cursorStrength, dotRgb, glowRgb]);

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "transparent",
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {/* Subtle radial depth gradient preserving website's exact background color */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 30%, transparent 40%, rgba(224, 224, 224, 0.45) 100%)",
        }}
      />
    </div>
  );
};

export default DotGridBackground;
