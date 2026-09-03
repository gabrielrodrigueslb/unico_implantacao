"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className = "",
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand/40" />
      <DialogPrimitive.Content
        className={`fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl outline-none ${className}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
      <div>
        <DialogPrimitive.Title className="text-lg font-bold text-brand">{title}</DialogPrimitive.Title>
        {subtitle ? (
          <DialogPrimitive.Description className="mt-1 text-sm text-brand/60">
            {subtitle}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      <DialogPrimitive.Close className="shrink-0 rounded-lg p-1 text-brand/40 hover:bg-brand-light hover:text-brand">
        <X className="size-5" />
      </DialogPrimitive.Close>
    </div>
  );
}

export function DialogBody({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`scrollbar-thin flex-1 overflow-y-auto px-6 py-5 ${className}`}
      {...props}
    />
  );
}

export function DialogFooter({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`flex flex-col gap-3 border-t border-hairline px-6 py-4 sm:flex-row ${className}`}
      {...props}
    />
  );
}
