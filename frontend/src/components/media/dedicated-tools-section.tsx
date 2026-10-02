"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FaInstagram, 
  FaTiktok, 
  FaPinterest, 
  FaReddit, 
  FaThreads, 
  FaFacebook, 
  FaXTwitter 
} from "react-icons/fa6";

export interface DedicatedPlatform {
  id: string;
  number: string;
  name: string;
  buttonLabel: string;
  sentence: string;
  href: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>;
}

export const DEDICATED_PLATFORMS: DedicatedPlatform[] = [
  {
    id: "instagram",
    number: "01",
    name: "Instagram",
    buttonLabel: "Use Instagram",
    sentence: "Reels worth\nreplaying.",
    href: "/instagram-downloader",
    Icon: FaInstagram,
  },
  {
    id: "tiktok",
    number: "02",
    name: "TikTok",
    buttonLabel: "Use TikTok",
    sentence: "Save the clip.\nKeep the moment.",
    href: "/tiktok-downloader",
    Icon: FaTiktok,
  },
  {
    id: "pinterest",
    number: "03",
    name: "Pinterest",
    buttonLabel: "Use Pinterest",
    sentence: "Inspiration,\nready to save.",
    href: "/",
    Icon: FaPinterest,
  },
  {
    id: "reddit",
    number: "04",
    name: "Reddit",
    buttonLabel: "Use Reddit",
    sentence: "Community finds.\nSaved for later.",
    href: "/",
    Icon: FaReddit,
  },
  {
    id: "threads",
    number: "05",
    name: "Threads",
    buttonLabel: "Use Threads",
    sentence: "From the thread.\nTo your files.",
    href: "/",
    Icon: FaThreads,
  },
  {
    id: "facebook",
    number: "06",
    name: "Facebook",
    buttonLabel: "Use Facebook",
    sentence: "Shared moments.\nSaved memories.",
    href: "/",
    Icon: FaFacebook,
  },
  {
    id: "x_twitter",
    number: "07",
    name: "X / Twitter",
    buttonLabel: "Use X / Twitter",
    sentence: "Off the timeline.\nInto your files.",
    href: "/",
    Icon: FaXTwitter,
  },
];

export function DedicatedToolsSection() {
  const [selectedId, setSelectedId] = useState<string>("threads");
  const [direction, setDirection] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const currentIndex = DEDICATED_PLATFORMS.findIndex((p) => p.id === selectedId);
  const currentPlatform = DEDICATED_PLATFORMS[currentIndex] || DEDICATED_PLATFORMS[0];
  const CurrentIcon = currentPlatform.Icon;

  // Auto-slideshow: smoothly cycles cards one by one every 3.2 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setSelectedId((prevId) => {
        const idx = DEDICATED_PLATFORMS.findIndex((p) => p.id === prevId);
        const nextIdx = (idx + 1) % DEDICATED_PLATFORMS.length;
        return DEDICATED_PLATFORMS[nextIdx].id;
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleSelect = (newId: string) => {
    if (newId === selectedId) return;
    const newIdx = DEDICATED_PLATFORMS.findIndex((p) => p.id === newId);
    setDirection(newIdx >= currentIndex ? 1 : -1);
    setSelectedId(newId);
  };

  const handleCycleNext = () => {
    const nextIdx = (currentIndex + 1) % DEDICATED_PLATFORMS.length;
    setDirection(1);
    setSelectedId(DEDICATED_PLATFORMS[nextIdx].id);
  };

  const handleActionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "/") {
      e.preventDefault();
      const inputEl = document.querySelector(
        'input[type="url"], input[type="text"]'
      ) as HTMLInputElement | null;
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
        inputEl.focus();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      aria-label="Dedicated Downloader Tools"
      style={{
        paddingTop: "3.5rem",
        paddingBottom: "4.5rem",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div className="dedicated-tools-container">
        {/* 1. SECTION HEADING: Bold Two-Tone centered heading */}
        <div style={{ textAlign: "center", marginBottom: "3.25rem" }}>
          <h2
            style={{
              fontSize: "clamp(2.2rem, 5.2vw, 3.25rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: 0,
              textAlign: "center",
              fontFamily: "var(--font-heading)",
            }}
          >
            <span style={{ display: "block", color: "#16171a" }}>Explore Dedicated</span>
            <span style={{ display: "block", color: "#5e6065", fontWeight: 800 }}>Downloader Tools</span>
          </h2>
        </div>

        {/* 3-COLUMN DESKTOP LAYOUT (Left Nav | Center Polaroid Stack | Right Action Button) */}
        <div className="dedicated-tools-layout">
          {/* LEFT: Desktop Platform Selector — Clean & static without hover effects */}
          <div
            className="dedicated-tools-nav-desktop"
            role="tablist"
            aria-label="Select Platform"
          >
            {DEDICATED_PLATFORMS.map((platform) => {
              const isSelected = platform.id === selectedId;
              return (
                <button
                  key={platform.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(platform.id)}
                  className={`dedicated-tools-nav-item ${isSelected ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    border: "1px solid transparent",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 800 : 500,
                      color: isSelected ? "var(--text-color)" : "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                      width: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {platform.number}
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: isSelected ? 800 : 500,
                      color: isSelected ? "var(--text-color)" : "var(--text-muted)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MIDDLE: Overlapping Paper Card Stack with Auto Slideshow */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              position: "relative",
              width: "min(330px, 90vw)",
              height: "420px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* Back Card 1 (Tilted counter-clockwise, reactively responds to card changes) */}
            <motion.div
              aria-hidden="true"
              animate={{
                rotate: direction > 0 ? [-4.5, -6.5, -4.5] : [-4.5, -3, -4.5],
                scale: [1, 0.985, 1],
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: "#f2f3f5",
                borderRadius: "18px",
                boxShadow: "0 10px 26px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                transform: "rotate(-4.5deg) translate(-4px, -2px)",
                pointerEvents: "none",
              }}
            />

            {/* Back Card 2 (Tilted clockwise, reactively responds to card changes) */}
            <motion.div
              aria-hidden="true"
              animate={{
                rotate: direction > 0 ? [3.5, 5.5, 3.5] : [3.5, 1.8, 3.5],
                scale: [1, 0.985, 1],
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: "#fafafa",
                borderRadius: "18px",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.09)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                transform: "rotate(3.5deg) translate(5px, 2px)",
                pointerEvents: "none",
              }}
            />

            {/* Foreground Paper Card with Authentic Deck-Shuffle Animation */}
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={currentPlatform.id}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir > 0 ? 55 : -55,
                    y: 20,
                    scale: 0.93,
                    rotate: dir > 0 ? 5 : -5,
                    opacity: 0,
                    zIndex: 10,
                  }),
                  center: {
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: -1.2,
                    opacity: 1,
                    zIndex: 10,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                      mass: 0.8,
                    },
                  },
                  exit: (dir: number) => ({
                    x: dir > 0 ? -100 : 100,
                    y: -24,
                    scale: 0.94,
                    rotate: dir > 0 ? -11 : 11,
                    opacity: 0,
                    zIndex: 20,
                    transition: {
                      duration: 0.28,
                      ease: [0.32, 0.72, 0, 1],
                    },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                onClick={handleCycleNext}
                title="Click to view next platform"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#ffffff",
                  borderRadius: "18px",
                  padding: "14px 14px 12px 14px",
                  boxShadow: "0 20px 42px rgba(0, 0, 0, 0.13), 0 4px 12px rgba(0, 0, 0, 0.05)",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {/* Dark Charcoal Inner Panel */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "330px",
                    backgroundColor: "#212225",
                    borderRadius: "12px",
                    padding: "26px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden",
                  }}
                >
                  {/* Top Label: ONLY AVERO */}
                  <div style={{ zIndex: 2 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        userSelect: "none",
                      }}
                    >
                      AVERO
                    </span>
                  </div>

                  {/* Platform Sentence with Smooth Text Fade */}
                  <motion.div
                    key={`text-${currentPlatform.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.05 }}
                    style={{ zIndex: 2, margin: "auto 0" }}
                  >
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "1.85rem",
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        whiteSpace: "pre-line",
                        margin: 0,
                      }}
                    >
                      {currentPlatform.sentence}
                    </p>
                  </motion.div>

                  {/* Concentric Arcs in Lower-Right */}
                  <svg
                    style={{
                      position: "absolute",
                      bottom: "-25px",
                      right: "-25px",
                      width: "220px",
                      height: "220px",
                      pointerEvents: "none",
                      opacity: 0.18,
                      zIndex: 1,
                    }}
                    viewBox="0 0 200 200"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="170" cy="170" r="60" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="170" cy="170" r="105" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="170" cy="170" r="150" stroke="#ffffff" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* White Polaroid Card Footer */}
                <motion.div
                  key={`footer-${currentPlatform.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.04 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 4px 2px 4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CurrentIcon
                      style={{ width: 17, height: 17, color: "#16171a", flexShrink: 0 }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "15px",
                        color: "#16171a",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {currentPlatform.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#8e9199",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {currentPlatform.number}
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Action Button in Website's Signature Pearl Theme */}
          <div className="dedicated-tools-btn-col">
            <Link
              href={currentPlatform.href}
              onClick={(e) => handleActionClick(e, currentPlatform.href)}
              className="btn-pearl dedicated-tools-action-btn"
            >
              <span>{currentPlatform.buttonLabel}</span>
              <ArrowUpRight style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
