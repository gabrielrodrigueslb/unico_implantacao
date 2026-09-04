import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { env } from "./config/env";
import { AppError } from "./lib/errors";
import { requireAuth } from "./middleware/auth.middleware";
import { requireTrustedOrigin } from "./middleware/csrf.middleware";
import { auditLogRoutes } from "./modules/audit-logs/audit-log.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { deploymentRoutes } from "./modules/deployments/deployment.routes";
import { implantationRoutes } from "./modules/implantations/implantation.routes";
import { onboardingRoutes } from "./modules/onboarding/onboarding.routes";
import { plansRoutes } from "./modules/plans/plans.routes";
import { userRoutes } from "./modules/users/user.routes";

export const app = express();

// API JSON pura, sem HTML renderizado — desliga CSP/COEP do helmet (que
// seriam no-op ou atrapalhariam downloads) e mantém só os headers que
// importam aqui: no-sniff, sem referrer pra fora, HSTS.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// `credentials: true` exige uma origem explícita (não pode ser "*") — é o
// próprio Next.js do painel administrativo, ver FRONTEND_URL no .env.
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// CSRF: o cookie de sessão é SameSite=None (cross-origin por design — ver
// lib/auth.ts), então todo método que muda estado exige Origin/Referer
// confiável. Depois do CORS/parsers, antes de qualquer rota.
app.use(requireTrustedOrigin);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Login nasce aqui — não pode exigir a própria sessão.
app.use("/auth", authRoutes);
// Gestão de contas do painel — sempre autenticado (ver requireAdmin dentro
// das rotas).
app.use("/users", userRoutes);

// `/onboarding` fica de fora de propósito: é o fluxo público que o cliente
// preenche a partir do link, sem login algum.
app.use("/implantations", requireAuth, implantationRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/deployments", requireAuth, deploymentRoutes);
app.use("/plans", requireAuth, plansRoutes);
// Busca global de auditoria — só ADMIN (ver requireAdmin dentro do router).
app.use("/audit-logs", requireAuth, auditLogRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos",
      issues: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
});
