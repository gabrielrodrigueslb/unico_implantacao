"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className = "",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={`flex w-full items-center justify-between rounded-xl border border-border-soft bg-white px-4 py-3 text-base text-brand outline-none transition-colors focus:border-accent data-[placeholder]:text-brand/40 ${className}`}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 shrink-0 text-brand/40" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border-soft bg-white shadow-lg"
        position="popper"
        side="bottom"
        avoidCollisions={false}
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport
          className="scrollbar-thin overflow-y-auto p-1"
          style={{ maxHeight: "min(18rem, var(--radix-select-content-available-height, 18rem))" }}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className = "",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={`relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand outline-none data-[highlighted]:bg-brand-light data-[disabled]:cursor-not-allowed data-[disabled]:text-brand/30 data-[disabled]:data-[highlighted]:bg-transparent ${className}`}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Check className="size-4 text-accent" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
