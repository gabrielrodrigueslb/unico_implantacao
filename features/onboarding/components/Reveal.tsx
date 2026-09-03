"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/** Anima a entrada/saída de campos condicionais (ex: "usa URA?" → mensagens). */
export function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
