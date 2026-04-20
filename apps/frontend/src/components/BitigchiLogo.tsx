"use client";

import { motion } from "framer-motion";

interface BitigchiLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function BitigchiLogo({ size = 40, className = "", animated = true }: BitigchiLogoProps) {
  const Wrapper = animated ? motion.svg : "svg";
  const wrapperProps = animated
    ? {
        whileHover: { scale: 1.05 },
        transition: { type: "spring", stiffness: 300 },
      }
    : {};

  return (
    <Wrapper
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...(wrapperProps as Record<string, unknown>)}
    >
      <defs>
        <linearGradient id="bitigchi-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" />
          <stop offset="50%" stopColor="#e8d48b" />
          <stop offset="100%" stopColor="#b08d57" />
        </linearGradient>
        <linearGradient id="bitigchi-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Scroll / Document base */}
      <path
        d="M16 8 C16 8 14 8 14 10 L14 50 C14 52 16 54 18 54 L44 54 C46 54 48 52 48 50 L48 18 L40 8 Z"
        fill="url(#bitigchi-gold)"
        opacity="0.15"
        stroke="url(#bitigchi-gold)"
        strokeWidth="1.2"
      />

      {/* Scroll fold */}
      <path
        d="M40 8 L40 18 L48 18"
        fill="none"
        stroke="url(#bitigchi-gold)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Chart line — ascending trend */}
      <motion.path
        d="M20 42 L26 36 L30 39 L36 28 L42 24"
        fill="none"
        stroke="url(#bitigchi-cyan)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={animated ? { duration: 1.5, ease: "easeInOut" } : undefined}
      />

      {/* Data nodes on chart */}
      {[
        { cx: 20, cy: 42 },
        { cx: 26, cy: 36 },
        { cx: 30, cy: 39 },
        { cx: 36, cy: 28 },
        { cx: 42, cy: 24 },
      ].map((point, i) => (
        <motion.circle
          key={i}
          cx={point.cx}
          cy={point.cy}
          r="2"
          fill="#00d4ff"
          filter="url(#glow)"
          initial={animated ? { opacity: 0, scale: 0 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={animated ? { delay: 0.3 + i * 0.2, duration: 0.3 } : undefined}
        />
      ))}

      {/* Quill pen hint — top right */}
      <path
        d="M44 10 L50 4 C51 3 52 4 51 5 L46 12"
        fill="none"
        stroke="url(#bitigchi-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Text lines on scroll */}
      <line x1="20" y1="20" x2="32" y2="20" stroke="#c9a84c" strokeWidth="0.8" opacity="0.3" />
      <line x1="20" y1="24" x2="28" y2="24" stroke="#c9a84c" strokeWidth="0.8" opacity="0.2" />
    </Wrapper>
  );
}
