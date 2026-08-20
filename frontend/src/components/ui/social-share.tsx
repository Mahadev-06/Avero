"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiLink, FiCheck, FiShare2 } from "react-icons/fi";

export interface SocialShareLinks {
  whatsapp?: string;
  instagram?: string;
  x?: string;
  facebook?: string;
}

export function SocialShareButton({
  links = {},
  label = "Share Avero",
}: {
  links?: SocialShareLinks;
  label?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("https://avero.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const shareText = "Download videos, reels, photos & audio in master quality with Avero:";

  const defaultLinks: SocialShareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`,
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    instagram: "https://instagram.com/",
    ...links,
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const icons = [
    {
      key: "whatsapp",
      Icon: FaWhatsapp,
      label: "Share on WhatsApp",
      href: defaultLinks.whatsapp,
      color: "#25D366",
    },
    {
      key: "x",
      Icon: FaXTwitter,
      label: "Share on X",
      href: defaultLinks.x,
      color: "#0f0f0f",
    },
    {
      key: "facebook",
      Icon: FaFacebook,
      label: "Share on Facebook",
      href: defaultLinks.facebook,
      color: "#1877F2",
    },
    {
      key: "instagram",
      Icon: FaInstagram,
      label: "Instagram",
      href: defaultLinks.instagram,
      color: "#E1306C",
    },
  ];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setHovered((prev) => !prev)}
    >
      <div
        style={{
          background: "var(--bg-color)",
          borderRadius: "22px",
          padding: "6px",
          border: "1px solid rgba(255, 255, 255, 0.65)",
          boxShadow: "4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)",
        }}
      >
        <motion.div
          animate={{
            boxShadow: hovered
              ? "inset 3px 3px 8px var(--neumorph-dark), inset -1px -1px 2px var(--neumorph-light)"
              : "inset 2px 2px 5px var(--neumorph-dark), inset -1px -1px 2px var(--neumorph-light)",
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: "var(--bg-color)",
            borderRadius: "16px",
            minWidth: "240px",
            height: "56px",
            position: "relative",
            overflow: "hidden",
            padding: "4px",
          }}
        >
          {/* Default Label State */}
          <motion.div
            animate={{ y: hovered ? "-100%" : "0%" }}
            transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "absolute",
              inset: "4px",
              borderRadius: "12px",
              background: "var(--bg-color)",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              boxShadow: "3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <FiShare2 style={{ fontSize: "16px", color: "var(--color-accent-500)" }} />
            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--text-color)",
                userSelect: "none",
              }}
            >
              {label}
            </span>
          </motion.div>

          {/* Hovered Icons State */}
          <motion.div
            animate={{ y: hovered ? "0%" : "100%" }}
            transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "absolute",
              inset: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {/* Copy Link Button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              title={copied ? "Copied to clipboard!" : "Copy website link"}
              aria-label="Copy website link"
              whileHover={{ scale: 1.18, rotate: -4 }}
              whileTap={{ scale: 0.88 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                color: copied ? "#16a34a" : "var(--text-color)",
                fontSize: "16px",
                cursor: "pointer",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                background: copied ? "rgba(34, 197, 94, 0.12)" : "var(--bg-color)",
                boxShadow: "2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)",
                flexShrink: 0,
                transition: "color 0.2s ease, background 0.2s ease",
              }}
            >
              {copied ? <FiCheck style={{ strokeWidth: 3 }} /> : <FiLink />}
            </motion.button>

            {icons.map(({ key, Icon, label: iconLabel, href, color }, i) => (
              <motion.a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={iconLabel}
                title={iconLabel}
                initial={false}
                transition={{
                  delay: hovered ? i * 0.04 : 0,
                  type: "spring",
                  bounce: 0.35,
                  duration: 0.3,
                }}
                whileHover={{ scale: 1.22, rotate: -6 }}
                whileTap={{ scale: 0.88 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  color: color,
                  fontSize: "18px",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.7)",
                  background: "var(--bg-color)",
                  boxShadow: "2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)",
                  flexShrink: 0,
                }}
              >
                <Icon />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
