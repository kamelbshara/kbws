import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedUploadType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export type StoredFile = { url: string; fileName: string; fileSize: number; mimeType: string };

/**
 * Saves an uploaded file and returns its public URL. Uses Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is configured (production). Without it, falls back to
 * writing under public/uploads for local/dev testing -- note that fallback is
 * NOT viable in a real Vercel deployment (the serverless filesystem is
 * ephemeral and public/ writes aren't served), so BLOB_READ_WRITE_TOKEN must
 * be set before this feature works in production.
 */
export async function saveUploadedFile(file: File, subdir: string): Promise<StoredFile> {
  const ext = path.extname(file.name).slice(0, 20);
  const key = `${subdir}/${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, file, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN });
    return { url: blob.url, fileName: file.name, fileSize: file.size, mimeType: file.type };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadsDir, { recursive: true });
  const diskName = `${randomUUID()}${ext}`;
  await writeFile(path.join(uploadsDir, diskName), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${subdir}/${diskName}`, fileName: file.name, fileSize: file.size, mimeType: file.type };
}
