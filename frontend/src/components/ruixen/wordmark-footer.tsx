"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";

/**
 * Wordmark Footer — AVERO Edition.
 * Giant full-width brand wordmark anchored to the very bottom of the page
 * with interactive cursor-tracking pearl white illumination and subtle half-cut.
 */

interface WordmarkFooterProps {
  className?: string;
}

/* ── Radial shine gradient — follows cursor with pearl-white luminance ── */
function makeShine(x: number, y: number): string {
  return `radial-gradient(ellipse 90% 90% at ${x.toFixed(1)}% ${y.toFixed(1)}%, #ffffff 0%, rgba(255, 255, 255, 0.96) 28%, rgba(235, 235, 240, 0.65) 60%, rgba(215, 215, 225, 0.35) 100%)`;
}

/* ── Vertical mask — dims bottom for subtle half-cut fade ── */
const VMASK =
  "linear-gradient(to bottom, black 0%, black 52%, rgba(0,0,0,0.75) 82%, rgba(0,0,0,0.3) 100%)";

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
        backgroundColor: "var(--bg-color)",
        height: "clamp(150px, 21vw, 280px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        borderTop: "1px solid rgba(255, 255, 255, 0.45)",
        boxShadow: "inset 0 4px 12px var(--neumorph-dark)",
        marginTop: "1.5rem",
        paddingBottom: "0",
      }}
    >
      {/* ── Wordmark — anchored to bottom edge, perfectly sized ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{
          width: "100%",
          maxWidth: "1340px",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 clamp(16px, 3vw, 48px)",
          pointerEvents: "none",
        }}
      >
        {/* Exact AVERO Logo rendered with alpha-mask, expansive responsive sizing */}
        <div
          ref={logoRef}
          style={{
            width: "clamp(300px, 88vw, 1240px)",
            height: "clamp(80px, 18vw, 220px)",
            backgroundImage: makeShine(50, 30),
            WebkitMaskImage: "url(/avero-logo-white.png)",
            maskImage: "url(/avero-logo-white.png)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "bottom center",
            maskPosition: "bottom center",
            filter: "drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12)) drop-shadow(0 -1px 3px rgba(255, 255, 255, 0.95))",
            opacity: 0.96,
            transition: "filter 0.3s ease",
            transform: "translateY(6%)",
          }}
        />
      </motion.div>
    </section>
  );
}

export default WordmarkFooter;
