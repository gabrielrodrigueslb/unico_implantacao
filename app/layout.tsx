import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unico Implantação",
  description: "Onboarding de implantação do Atender Bem",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("h-full", "antialiased", plusJakartaSans.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
