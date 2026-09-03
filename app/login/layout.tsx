import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Porta de entrada do painel administrativo — mesma política de robots do
 * `/admin`: nunca deve ser indexado.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
