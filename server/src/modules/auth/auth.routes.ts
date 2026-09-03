import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { authController } from "./auth.controller";

export const authRoutes = Router();

// Sem isso, um e-mail de AdminUser conhecido vira alvo de força bruta
// ilimitada — 10 tentativas por IP a cada 15 min é folgado pro uso legítimo
// (erro de digitação) e curto pra tentativa automatizada.
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

// Públicas — é aqui que a sessão nasce, não pode exigir a própria sessão.
authRoutes.post("/login", loginRateLimit, asyncHandler(authController.login));
authRoutes.post("/logout", asyncHandler(authController.logout));

authRoutes.get("/me", requireAuth, asyncHandler(authController.me));
authRoutes.put("/me", requireAuth, asyncHandler(authController.updateMe));
