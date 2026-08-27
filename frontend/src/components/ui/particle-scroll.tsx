"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface ParticleScrollOptions {
  /** Maximum number of sand/dust particles */
  particleCount?: number;
  /** Particle size multiplier in CSS pixels */
  size?: number;
  /** Spread distance on scroll impulse */
  spread?: number;
  /** Gravity pull downward (-1 to 1) */
  gravity?: number;
  /** Swirl intensity */
  swirl?: number;
  /** Settle duration in seconds */
  settle?: number;
  /** Base opacity */
  opacity?: number;
}

interface Particle {
  relX: number; // 0 to 1 across viewport
  relY: number; // 0 to 1 across viewport
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  stagger: number;
}

const PALETTE = [
  "rgba(245, 158, 11, 0.85)",  // Amber Gold #f59e0b
  "rgba(191, 117, 64, 0.85)",  // Warm Copper #bf7540
  "rgba(38, 38, 38, 0.75)",    // Charcoal #262626
  "rgba(230, 34, 41, 0.7)",    // Vermilion #e62229
  "rgba(100, 100, 100, 0.6)",  // Slate
];

export function ParticleScroll({
  children,
  className,
  style,
  particleCount = 450,
  size = 2.2,
  spread = 160,
  gravity = 0.25,
  swirl = 45,
  settle = 1.0,
  opacity = 0.85,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & ParticleScrollOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    // Spawn particles evenly distributed with random offsets
    const count = Math.min(particleCount, Math.floor((width * height) / 3200));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const relX = Math.random();
      const relY = Math.random();
      const pSize = (Math.random() * 1.8 + 1.2) * size;
      const baseAlpha = (Math.random() * 0.45 + 0.4) * opacity;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

      particles.push({
        relX,
        relY,
        x: relX * width,
        y: relY * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        homeX: relX * width,
        homeY: relY * height,
        size: pSize,
        color,
        alpha: baseAlpha,
        baseAlpha,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.8 + 0.6,
        stagger: Math.random() * 0.6 + 0.4,
      });
    }

    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    let scrollImpulse = 0;
    let time = 0;
    let mouseX = -9999;
    let mouseY = -9999;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const dy = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Accumulate velocity impulse from scroll
      scrollVel += dy * 0.75;
      scrollImpulse = Math.min(Math.max(scrollImpulse + Math.abs(dy) * 0.15, 0), 100);

      // Scatter particles when scrolling
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dir = dy > 0 ? 1 : -1;
        const angle = p.phase + Math.random() * 0.5;
        p.vy += -dir * (Math.random() * 4 + 2) * p.stagger;
        p.vx += Math.cos(angle) * (Math.random() * 3 + 1);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let raf = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      time += dt;

      // Smooth scroll velocity decay
      scrollVel *= Math.exp(-dt * 4.5);
      scrollImpulse *= Math.exp(-dt * 2.8);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update home position relative to current viewport size
        p.homeX = p.relX * width;
        p.homeY = p.relY * height;

        // Idle Brownian drift
        const driftX = Math.sin(time * p.speed + p.phase) * 8;
        const driftY = Math.cos(time * p.speed * 0.8 + p.phase) * 6;

        // Target position
        const targetX = p.homeX + driftX;
        const targetY = p.homeY + driftY;

        // Physics toward target with damping
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);

        // Spring force back to home
        const spring = Math.min(dt * 3.5 * (1 / (p.stagger * settle)), 0.35);
        p.vx += dx * spring;
        p.vy += dy * spring;

        // Gravity pull
        p.vy += gravity * 20 * dt;

        // Mouse proximity gentle dispersion
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < 120 && mDist > 0) {
          const force = (1 - mDist / 120) * 15;
          p.vx += (mdx / mDist) * force * dt * 10;
          p.vy += (mdy / mDist) * force * dt * 10;
        }

        // Apply friction
        const friction = Math.exp(-dt * 5.0);
        p.vx *= friction;
        p.vy *= friction;

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle (sand dust grain)
        const speed = Math.hypot(p.vx, p.vy);
        const stretch = 1 + Math.min(speed / 12, 1.8);
        const currentAlpha = Math.min(p.baseAlpha * (1 + scrollImpulse * 0.02), 0.95);

        ctx.save();
        ctx.translate(p.x, p.y);

        if (speed > 1.2) {
          const angle = Math.atan2(p.vy, p.vx);
          ctx.rotate(angle);
          ctx.scale(stretch, 1 / Math.sqrt(stretch));
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [particleCount, size, spread, gravity, swirl, settle, opacity]);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", ...style }}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 999,
        }}
      />
    </div>
  );
}

export default ParticleScroll;
