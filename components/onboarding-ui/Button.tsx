"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "outline" | "accent" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand/90",
  outline: "bg-card text-brand border border-brand hover:bg-brand-light",
  accent: "bg-accent text-white hover:bg-accent/90",
  ghost: "text-brand/60 hover:text-brand",
  danger: "text-red-500 hover:text-red-600",
};

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
