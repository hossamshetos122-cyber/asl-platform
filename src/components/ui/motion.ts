"use client";

import type { Variants } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";

export { motion, AnimatePresence };

/** Staggered container for lists/grids (children use `fadeUp` variants). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Standard fade-up entrance for a single element. */
export const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay },
  },
});

/** Spring pop-in used for podium / stat cards. */
export const popIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 240, damping: 20, delay },
  },
});