import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import multer from "multer";
import { parse } from "csv-parse/sync";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../lib/errors";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 20_000;
const UPLOAD_DIRECTORY = path.resolve(__dirname, "../../..", "uploads", "contact-imports");
const allowedMimeTypes = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"]);
const knownHeaders = new Set(["nome", "name", "telefone", "phone", "celular", "whatsapp", "email", "e-mail"]);

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").replace(/^\uFEFF/, "");
}

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
  filename: (_req, _file, callback) => callback(null, `${randomUUID()}.csv`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension !== ".csv" || !allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Envie somente arquivos CSV.", 415));
      return;
    }
    callback(null, true);
  },
});

/** Middleware que converte erros de multipart em respostas claras de API. */
export function uploadContactCsv(req: Request, res: Response, next: NextFunction) {
  multerUpload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("O CSV pode ter no máximo 10 MB.", 413));
      return;
    }
    next(error);
  });
}

function publicData(record: {
  id: string; originalName: string; sizeBytes: number; columns: string[]; totalRows: number; validRows: number; invalidRows: number; preview: unknown; createdAt: Date;
}) {
  return {
    id: record.id,
    originalName: record.originalName,
    sizeBytes: record.sizeBytes,
    columns: record.columns,
    totalRows: record.totalRows,
    validRows: record.validRows,
    invalidRows: record.invalidRows,
    preview: record.preview,
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

function analyseCsv(content: string) {
  const rows = parse(content, { columns: true, bom: true, skip_empty_lines: true, trim: true, relax_column_count: true, max_record_size: 64 * 1024 }) as Record<string, string>[];
  if (!rows.length) throw new AppError("O CSV não possui contatos.");
  if (rows.length > MAX_ROWS) throw new AppError(`O CSV pode ter no máximo ${MAX_ROWS.toLocaleString("pt-BR")} contatos.`, 413);
  const columns = Object.keys(rows[0] ?? {});
  if (!columns.length || !columns.some((column) => knownHeaders.has(normalizeHeader(column)))) {
    throw new AppError("Inclua pelo menos uma coluna reconhecida: nome, telefone, celular, WhatsApp ou e-mail.");
  }
  const valid = rows.filter((row) => Object.entries(row).some(([key, value]) => knownHeaders.has(normalizeHeader(key)) && String(value ?? "").trim() !== ""));
  if (!valid.length) throw new AppError("Nenhum contato válido foi encontrado no CSV.");
  return { columns, totalRows: rows.length, validRows: valid.length, invalidRows: rows.length - valid.length, preview: rows.slice(0, 10) };
}

async function removeFile(storageName: string) {
  await fs.unlink(path.join(UPLOAD_DIRECTORY, storageName)).catch(() => undefined);
}

async function save(token: string, file: Express.Multer.File) {
  const implantation = await findEditableOnboarding(token);
  try {
    const analysis = analyseCsv(await fs.readFile(file.path, "utf8"));
    const onboarding = implantation.onboarding ?? await prisma.onboarding.create({ data: { implantationId: implantation.id, responses: {} } });
    const previous = await prisma.contactImport.findUnique({ where: { onboardingId: onboarding.id } });
    const record = await prisma.contactImport.upsert({
      where: { onboardingId: onboarding.id },
      create: { onboardingId: onboarding.id, originalName: path.basename(file.originalname), storageName: file.filename, sizeBytes: file.size, ...analysis },
      update: { originalName: path.basename(file.originalname), storageName: file.filename, sizeBytes: file.size, ...analysis },
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
  if (!onboarding?.contactImport) throw new NotFoundError("Nenhum CSV foi enviado para esta implantação");
  const filePath = path.join(UPLOAD_DIRECTORY, onboarding.contactImport.storageName);
  await fs.access(filePath);
  return { filePath, originalName: onboarding.contactImport.originalName };
}

export const contactImportService = { save, getByImplantation, downloadByImplantation };
