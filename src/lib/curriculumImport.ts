import { parse } from "csv-parse/sync";
import { z } from "zod";

export const CURRICULUM_IMPORT_COLUMNS = [
  "subjectCode",
  "gradeLevel",
  "track",
  "unit",
  "unitTitle",
  "lessonTitle",
  "orderIndex",
  "skill",
  "textEn",
  "textAr",
] as const;

const rowSchema = z.object({
  subjectCode: z.string().min(1, "subjectCode is required"),
  gradeLevel: z.coerce.number().int(),
  track: z.enum(["GENERAL", "ADVANCED", ""]).optional().default(""),
  unit: z.string().min(1, "unit is required"),
  unitTitle: z.string().min(1, "unitTitle is required"),
  lessonTitle: z.string().min(1, "lessonTitle is required"),
  orderIndex: z.coerce.number().int().default(0),
  skill: z.string().min(1, "skill is required"),
  textEn: z.string().min(1, "textEn is required"),
  textAr: z.string().min(1, "textAr is required"),
});

export type CurriculumImportRow = z.infer<typeof rowSchema>;

export type CurriculumImportResult = {
  rows: CurriculumImportRow[];
  errors: { row: number; message: string }[];
};

/**
 * Parses raw CSV text into validated rows. Row numbers in errors are 1-indexed
 * against the data rows (excluding the header), matching what a user sees in a
 * spreadsheet app with row 1 as the header.
 */
export function parseCurriculumCsv(text: string): CurriculumImportResult {
  const rows: CurriculumImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err) {
    return { rows: [], errors: [{ row: 0, message: `Could not parse CSV: ${err instanceof Error ? err.message : "unknown error"}` }] };
  }

  if (records.length > 2000) {
    return { rows: [], errors: [{ row: 0, message: "File has too many rows (max 2000)." }] };
  }

  records.forEach((record, index) => {
    const result = rowSchema.safeParse(record);
    if (!result.success) {
      errors.push({ row: index + 1, message: result.error.issues[0]?.message ?? "Invalid row" });
      return;
    }
    rows.push(result.data);
  });

  return { rows, errors };
}
