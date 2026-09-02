"use client";

import { motion, AnimatePresence } from "framer-motion";

export { motion, AnimatePresence };

// Variants live in src/lib/motion-variants.ts (plain data, no "use client") so
// both Server Components and Client Components can build props with them
// without invoking a client-module function from the server.
export { staggerContainer, fadeUp, popIn } from "@/lib/motion-variants";