"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";

export interface HeroTitleAnimationProps {
  className?: string;
  brandWords?: string[];
  highlightWords?: string[];
  style?: React.CSSProperties;
}

export function HeroTitleAnimation({
  className,
  brandWords = ["Free", "Social", "Media"],
  highlightWords = ["Video & Image Downloader"],
  style,
}: HeroTitleAnimationProps) {
  const [phase, setPhase] = useState<
    "measuring" | "fade-in" | "move" | "reveal" | "highlight" | "done"
  >("measuring");

  const [titleOffsetY, setTitleOffsetY] = useState(0);
  const [ready, setReady] = useState(false);

  const measureBrandRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  /* ─── Measure BEFORE first paint ─── */
  useLayoutEffect(() => {
    const brand = measureBrandRef.current;
    const container = containerRef.current;
    if (!brand || !container) return;

    const brandRect = brand.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const brandMidY = brandRect.top - containerRect.top + brandRect.height / 2;
    const containerMidY = containerRect.height / 2;
    setTitleOffsetY(containerMidY - brandMidY);

    setReady(true);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const startSequence = useCallback(() => {
    clearTimers();
    setPhase("fade-in");
    timersRef.current.push(setTimeout(() => setPhase("move"), 1100));
    timersRef.current.push(setTimeout(() => setPhase("reveal"), 1700));
    timersRef.current.push(setTimeout(() => setPhase("highlight"), 2300));
    timersRef.current.push(setTimeout(() => setPhase("done"), 2900));
  }, [clearTimers]);

  useEffect(() => {
    if (!ready) return;
    startSequence();
    return clearTimers;
  }, [ready, startSequence, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  /* ─── Derived flags ─── */
  const brandVisible = phase !== "measuring";
  const brandMoved =
    phase === "move" ||
    phase === "reveal" ||
    phase === "highlight" ||
    phase === "done";
  const showReveal =
    phase === "reveal" || phase === "highlight" || phase === "done";
  const showHighlight = phase === "highlight" || phase === "done";

  const titleBaseStyle: React.CSSProperties = {
    fontFamily: "var(--font-geist-sans), sans-serif",
    fontSize: "clamp(1.65rem, 3.4vw, 2.35rem)",
    fontWeight: 500,
    letterSpacing: "-0.02em",
    lineHeight: 1.28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: "0.65rem",
    color: "var(--text-color, #262626)",
    textAlign: "center",
    margin: 0,
    width: "100%",
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        paddingBottom: "0.6rem",
        ...style,
      }}
    >
      {/* ── Hidden sizing layer ── */}
      <h1
        style={{
          ...titleBaseStyle,
          visibility: "hidden",
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {/* Line 1: Brand text */}
        <span
          ref={measureBrandRef}
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            columnGap: "0.32em",
            fontWeight: 500,
          }}
        >
          {brandWords.map((w, i) => (
            <span key={i} style={{ display: "inline-block" }}>
              {w}
            </span>
          ))}
        </span>

        {/* Line 2: Highlight text below */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "0.35rem",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              columnGap: "0.28em",
              padding: "0.28rem 1.15rem",
            }}
          >
            {highlightWords.map((w, i) => (
              <span key={i} style={{ fontWeight: 700 }}>
                {w}
              </span>
            ))}
          </span>
        </span>
      </h1>

      {/* ── Visible animated title ── */}
      <h1
        style={{
          ...titleBaseStyle,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {/* Line 1: Brand Words (Centered initially, then glides up to top position) */}
        <span
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            columnGap: "0.32em",
            fontWeight: 500,
            color: "var(--text-color, #262626)",
            opacity: brandVisible ? 1 : 0,
            transform: `translateY(${brandMoved ? 0 : titleOffsetY}px)`,
            transition: brandMoved
              ? "opacity 0.55s ease-out, transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)"
              : "opacity 0.55s ease-out",
          }}
        >
          {brandWords.map((w, i) => (
            <span key={i} style={{ display: "inline-block" }}>
              {w}
            </span>
          ))}
        </span>

        {/* Line 2: Highlight Words (reveals smoothly underneath Line 1 with highlight pill sweep) */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "0.35rem",
            opacity: showReveal ? 1 : 0,
            transform: `translateY(${showReveal ? 0 : 14}px)`,
            filter: `blur(${showReveal ? 0 : 6}px)`,
            transition:
              "opacity 0.5s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              columnGap: "0.28em",
              padding: "0.28rem 1.15rem",
            }}
          >
            {/* Highlight box sweeps left → right */}
            <span
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                borderRadius: "var(--radius-lg, 18px)",
                backgroundColor: "var(--text-color, #262626)",
                boxShadow: "4px 4px 12px var(--neumorph-dark), -4px -4px 12px var(--neumorph-light)",
                pointerEvents: "none",
                transformOrigin: "left center",
                transform: `scaleX(${showHighlight ? 1 : 0})`,
                transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
            {highlightWords.map((word, i) => (
              <span
                key={`hl-${i}`}
                style={{
                  position: "relative",
                  zIndex: 2,
                  fontWeight: 700,
                  color: showHighlight
                    ? "#FFFFFF"
                    : "var(--text-color, #262626)",
                  transition: "color 0.3s ease 0.2s",
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </span>
      </h1>
    </div>
  );
}

export default HeroTitleAnimation;
