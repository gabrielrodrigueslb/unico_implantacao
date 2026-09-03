"use client";

import { motion } from "motion/react";
import Image from "next/image";

export function ChoiceCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        selected
          ? "border-selected-border bg-selected"
          : "border-border-soft bg-white hover:border-brand/40"
      }`}
    >
      <Image src={icon} alt="" width={56} height={56} className="shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="text-xl font-semibold text-brand/80">{title}</span>
        <span className="text-sm text-brand/60">{subtitle}</span>
      </div>
    </motion.button>
  );
}
