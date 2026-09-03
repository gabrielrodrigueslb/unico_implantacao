import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../lib/errors";

const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIRECTORY = path.resolve(__dirname, "../../..", "uploads", "contact-imports");
const allowedExtensions = new Set([".csv", ".xlsx"]);
const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/octet-stream",
]);

async function ensureDirectory() {
  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true, mode: 0o700 });
}

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await ensureDirectory();
      callback(null, UPLOAD_DIRECTORY);
    } catch (error) {
      callback(error as Error, "");
    }
  },
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Envie um arquivo CSV ou XLSX.", 415));
      return;
    }
    callback(null, true);
  },
});

/** Middleware que converte erros de multipart em respostas claras de API. */
export function uploadContactCsv(req: Request, res: Response, next: NextFunction) {
  multerUpload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("O arquivo pode ter no máximo 10 MB.", 413));
      return;
    }
    next(error);
  });
}

function publicData(record: {
  id: string; originalName: string; sizeBytes: number; createdAt: Date;
}) {
  return {
    id: record.id,
    originalName: record.originalName,
    sizeBytes: record.sizeBytes,
    uploadedAt: record.createdAt,
  };
}

async function findEditableOnboarding(token: string) {
  const implantation = await prisma.implantation.findUnique({
    where: { onboardingToken: token }, include: { onboarding: true },
  });
  if (!implantation || implantation.onboardingTokenRevokedAt || !implantation.onboardingTokenExpiresAt || implantation.onboardingTokenExpiresAt <= new Date()) {
    throw new NotFoundError("Link de onboarding inválido");
  }
  if (!["ONBOARDING_PENDING", "ONBOARDING_IN_PROGRESS"].includes(implantation.status)) {
    throw new AppError("Este onboarding já foi enviado e não aceita novos arquivos.", 409);
  }
  return implantation;
}

async function removeFile(storageName: string) {
  await fs.unlink(path.join(UPLOAD_DIRECTORY, storageName)).catch(() => undefined);
}

/**
 * Guarda o arquivo enviado sem analisar seu conteúdo — a importação de
 * contatos é uma etapa opcional e informativa, sem execução automática
 * sobre os dados, então não faz sentido validar colunas ou linhas aqui.
 */
async function save(token: string, file: Express.Multer.File) {
  const implantation = await findEditableOnboarding(token);
  try {
    const onboarding = implantation.onboarding ?? await prisma.onboarding.create({ data: { implantationId: implantation.id, responses: {} } });
    const previous = await prisma.contactImport.findUnique({ where: { onboardingId: onboarding.id } });
    const record = await prisma.contactImport.upsert({
      where: { onboardingId: onboarding.id },
      create: { onboardingId: onboarding.id, originalName: path.basename(file.originalname), storageName: file.filename, sizeBytes: file.size },
      update: { originalName: path.basename(file.originalname), storageName: file.filename, sizeBytes: file.size },
    });
    if (previous) await removeFile(previous.storageName);
    return publicData(record);
  } catch (error) {
    await removeFile(file.filename);
    throw error;
  }
}

async function getByImplantation(implantationId: string) {
  const onboarding = await prisma.onboarding.findUnique({ where: { implantationId }, include: { contactImport: true } });
  return onboarding?.contactImport ? publicData(onboarding.contactImport) : null;
}

async function downloadByImplantation(implantationId: string) {
  const onboarding = await prisma.onboarding.findUnique({ where: { implantationId }, include: { contactImport: true } });
  if (!onboarding?.contactImport) throw new NotFoundError("Nenhum arquivo foi enviado para esta implantação");
  const filePath = path.join(UPLOAD_DIRECTORY, onboarding.contactImport.storageName);
  await fs.access(filePath);
  return { filePath, originalName: onboarding.contactImport.originalName };
}

export const contactImportService = { save, getByImplantation, downloadByImplantation };
