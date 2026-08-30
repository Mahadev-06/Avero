"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";

/**
 * Wordmark Footer — AVERO Edition.
 * Fully responsive, uncropped brand watermark seamlessly integrated into the footer
 * with interactive cursor-following pearl white illumination.
 */

interface WordmarkFooterProps {
  className?: string;
}

/* ── Radial shine gradient — follows cursor with pearl-white luminance ── */
function makeShine(x: number, y: number): string {
  return `radial-gradient(ellipse 90% 90% at ${x.toFixed(1)}% ${y.toFixed(1)}%, #ffffff 0%, rgba(255, 255, 255, 0.96) 28%, rgba(235, 235, 240, 0.65) 60%, rgba(215, 215, 225, 0.35) 100%)`;
}

export function WordmarkFooter({ className }: WordmarkFooterProps) {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  /* ── Cursor-tracking state — refs only, zero re-renders ── */
  const hovering = useRef(false);
  const curX = useRef(50);
  const curY = useRef(30);
  const tgtX = useRef(50);
  const tgtY = useRef(30);
  const raf = useRef(0);

  /* ── Per-frame lerp loop — direct DOM writes ── */
  const paint = useCallback(() => {
    curX.current += (tgtX.current - curX.current) * 0.1;
    curY.current += (tgtY.current - curY.current) * 0.1;

    const grad = makeShine(curX.current, curY.current);

    if (logoRef.current) {
      logoRef.current.style.backgroundImage = grad;
    }

    const dx = Math.abs(tgtX.current - curX.current);
    const dy = Math.abs(tgtY.current - curY.current);

    if (hovering.current || dx > 0.05 || dy > 0.05) {
      raf.current = requestAnimationFrame(paint);
    }
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const r = sectionRef.current?.getBoundingClientRect();
      if (!r) return;
      tgtX.current = ((e.clientX - r.left) / r.width) * 100;
      tgtY.current = ((e.clientY - r.top) / r.height) * 100;

      if (!hovering.current) {
        hovering.current = true;
        raf.current = requestAnimationFrame(paint);
      }
    },
    [paint],
  );

  const onLeave = useCallback(() => {
    hovering.current = false;
    tgtX.current = 50;
    tgtY.current = 30;
    raf.current = requestAnimationFrame(paint);
  }, [paint]);

  /* ── Cleanup ── */
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* ── IntersectionObserver ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "transparent",
        padding: "2.5rem 1.5rem 3.5rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── Wordmark — Centered, perfectly proportioned, no zoom or clipping ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{
          width: "100%",
          maxWidth: "1180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Exact AVERO Logo rendered with alpha-mask and full containment */}
        <div
          ref={logoRef}
          style={{
            width: "min(88vw, 860px)",
            height: "clamp(60px, 11vw, 135px)",
            backgroundImage: makeShine(50, 30),
            WebkitMaskImage: "url(/avero-logo-white.png)",
            maskImage: "url(/avero-logo-white.png)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.10)) drop-shadow(0 -1px 2px rgba(255, 255, 255, 0.95))",
            opacity: 0.96,
            transition: "filter 0.3s ease",
          }}
        />
      </motion.div>
    </section>
  );
}

export default WordmarkFooter;
