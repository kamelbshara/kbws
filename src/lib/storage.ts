import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * The stored extension is derived from this map (keyed by the validated MIME
 * type), never from the client-supplied file.name. file.name and file.type
 * are two independent, equally attacker-controlled fields on a multipart
 * upload -- deriving the on-disk extension from file.name while validating
 * file.type would let an attacker satisfy the MIME allowlist (e.g.
 * "image/png") while naming the file "evil.html", persisting a
 * script-executable file that renders same-origin.
 */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export function isAllowedUploadType(mimeType: string): boolean {
  return Object.hasOwn(ALLOWED_MIME_TYPES, mimeType);
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
  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
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
