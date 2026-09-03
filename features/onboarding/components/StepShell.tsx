"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { PROGRESS_STEPS, type StepId } from "../types";

export function StepShell({
  step,
  kicker,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Próxima etapa",
  nextDisabled,
  children,
}: {
  step: StepId;
  kicker?: string;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: ReactNode;
}) {
  const stepIndex = PROGRESS_STEPS.findIndex((item) => item.id === step);
  const showStepCounter = stepIndex !== -1;
  const progress = showStepCounter ? (stepIndex + 1) / PROGRESS_STEPS.length : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative border-b border-hairline">
        <div className="flex items-center justify-between px-6 py-4 sm:px-[70px] sm:py-[18px]">
          <Image src="/logounico_azul.svg" alt="Unico" width={110} height={33} />
          {showStepCounter ? (
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stepIndex}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium text-brand/80"
                >
                  Etapa {stepIndex + 1} de {PROGRESS_STEPS.length}
                </motion.span>
              </AnimatePresence>
              <span className="flex size-[22px] items-center justify-center rounded-md bg-brand text-xs font-semibold text-white">
                ?
              </span>
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-hairline">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[750px] flex-1 flex-col px-6 py-16 sm:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {kicker || title ? (
              <div className="mb-10 flex flex-col items-center gap-2 text-center">
                {kicker ? (
                  <span className="text-base font-semibold text-brand/60">{kicker}</span>
                ) : null}
                {title ? (
                  <h1 className="text-3xl font-bold text-brand sm:text-[42px]">{title}</h1>
                ) : null}
                {subtitle ? <p className="text-base text-brand/60">{subtitle}</p> : null}
              </div>
            ) : null}

            <div className="flex-1">{children}</div>

            {onNext ? (
              <div className="mt-14 flex flex-col-reverse gap-3 sm:flex-row">
                {onBack ? (
                  <Button variant="outline" onClick={onBack} className="flex-1 select-none">
                    Voltar para a anterior
                  </Button>
                ) : null}
                <Button onClick={onNext} disabled={nextDisabled} className="flex-1 select-none">
                  {nextLabel}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
