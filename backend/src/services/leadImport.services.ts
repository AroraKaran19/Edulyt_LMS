import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipModel } from "../models/internship.schema";
import { BRANDS, type Brand } from "../constants/brands";
import { normalizeState } from "../constants/indianStates";
import { normalizePhone, isValidPhone } from "./phoneVerification.services";
import {
  defaultPair,
  getLeadPipeline,
  type LeadPipeline,
  type PipelineStage,
} from "./leadPipelineSettings.services";
import type { LeadAnswer, LeadProgram, LeadProgramKind } from "../types/lead";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EXTRA_KEYS = 30;
const MAX_EXTRA_KEY_LEN = 60;
const MAX_EXTRA_VALUE_LEN = 500;
const EXTRAS_ERROR = "extras must be a JSON object of simple values";
const INSERT_CHUNK_SIZE = 500;

export interface ImportRow {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  brand?: unknown;
  collegeName?: unknown;
  state?: unknown;
  programKind?: unknown;
  programSlug?: unknown;
  status?: unknown;
  subStatus?: unknown;
  extras?: unknown;
}

export type ImportOutcome = "ok" | "duplicate" | "error";

export interface ImportRowResult {
  row: number;
  outcome: ImportOutcome;
  error?: string;
}

export interface ImportSummary {
  ok: number;
  duplicate: number;
  error: number;
}

export interface ImportResponse {
  results: ImportRowResult[];
  summary: ImportSummary;
  created: number;
}

export interface ImportActor {
  userId: mongoose.Types.ObjectId | null;
  name: string;
}

export interface ImportOptions {
  fileName: string;
  dryRun: boolean;
  importedBy: ImportActor;
}

/** A key for a plain-text `extras` label, so the stored answer matches the shape `answers` already uses. */
const slugifyKey = (label: string): string => {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "key";
};

/** Parses `extras` into answer rows, or null when the text is not a flat object of simple values. */
const parseExtras = (raw: unknown): LeadAnswer[] | null => {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0 || entries.length > MAX_EXTRA_KEYS) return null;

  const answers: LeadAnswer[] = [];
  for (const [key, value] of entries) {
    if (!key || key.length > MAX_EXTRA_KEY_LEN) return null;
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      return null;
    }
    const strValue = String(value);
    if (strValue.length > MAX_EXTRA_VALUE_LEN) return null;
    answers.push({ key: slugifyKey(key), label: key, value: strValue });
  }
  return answers;
};

interface FieldsOk {
  ok: true;
  name: string;
  email: string;
  phone: string;
  brand: Brand;
  collegeName?: string;
  state?: string;
  answers: LeadAnswer[];
  status?: string;
  subStatus?: string;
  program?: { kind: LeadProgramKind; slug: string };
}

interface FieldsErr {
  ok: false;
  error: string;
}

/** Everything checkable without a database round trip. */
const validateFields = (row: ImportRow): FieldsOk | FieldsErr => {
  const name = String(row.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required" };

  const email = String(row.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email is required" };

  const phone = normalizePhone(row.phone);
  if (!isValidPhone(phone)) return { ok: false, error: "Enter a valid mobile number" };

  const brandRaw = String(row.brand ?? "").trim().toLowerCase();
  if (!BRANDS.includes(brandRaw as Brand)) return { ok: false, error: "Unknown brand" };
  const brand = brandRaw as Brand;

  let state: string | undefined;
  if (row.state !== undefined && row.state !== null && String(row.state).trim() !== "") {
    const normalized = normalizeState(row.state);
    if (!normalized) return { ok: false, error: "Unknown state" };
    state = normalized;
  }

  const collegeName =
    row.collegeName !== undefined && row.collegeName !== null
      ? String(row.collegeName).trim() || undefined
      : undefined;

  const kindRaw = row.programKind;
  const slugRaw = row.programSlug;
  const hasKind = kindRaw !== undefined && kindRaw !== null && String(kindRaw).trim() !== "";
  const hasSlug = slugRaw !== undefined && slugRaw !== null && String(slugRaw).trim() !== "";
  let program: { kind: LeadProgramKind; slug: string } | undefined;
  if (hasKind !== hasSlug) {
    return { ok: false, error: "programKind and programSlug must be given together" };
  }
  if (hasKind && hasSlug) {
    const kind = String(kindRaw).trim();
    if (kind !== "course" && kind !== "internship") {
      return { ok: false, error: "programKind must be course or internship" };
    }
    program = { kind, slug: String(slugRaw).trim() };
  }

  const answers = parseExtras(row.extras);
  if (answers === null) return { ok: false, error: EXTRAS_ERROR };

  const statusRaw =
    row.status !== undefined && row.status !== null ? String(row.status).trim() : "";
  const subStatusRaw =
    row.subStatus !== undefined && row.subStatus !== null ? String(row.subStatus).trim() : "";

  return {
    ok: true,
    name,
    email,
    phone,
    brand,
    collegeName,
    state,
    answers,
    status: statusRaw || undefined,
    subStatus: subStatusRaw || undefined,
    program,
  };
};

interface RowRecord {
  row: number;
  outcome: ImportOutcome;
  error?: string;
  data?: {
    name: string;
    email: string;
    phone: string;
    brand: Brand;
    collegeName?: string;
    state?: string;
    answers: LeadAnswer[];
    status: string;
    subStatus: string;
    program?: LeadProgram;
  };
}

const norm = (s: string): string => s.trim().toLowerCase();

/** A row may name a stage/sub-status by its stored key or by the label an admin sees. */
const findStageByKeyOrLabel = (
  pipeline: LeadPipeline,
  raw: string,
): PipelineStage | undefined =>
  pipeline.stages.find((s) => norm(s.key) === norm(raw) || norm(s.label) === norm(raw));

const findSubStatusByKeyOrLabel = (stage: PipelineStage, raw: string) =>
  stage.subStatuses.find((s) => norm(s.key) === norm(raw) || norm(s.label) === norm(raw));

/** Resolves the stage/sub-status pair a row lands on, against the live pipeline. */
const resolveStatusPair = async (
  status?: string,
  subStatus?: string,
): Promise<{ status: string; subStatus: string } | { error: string }> => {
  const pipeline = await getLeadPipeline();
  if (!status && !subStatus) {
    return defaultPair(pipeline);
  }
  if (!status) {
    // A bare sub-status names no stage to look it up under.
    return { error: "Unknown stage or sub-status" };
  }
  const stage = findStageByKeyOrLabel(pipeline, status);
  if (!stage || !stage.active) return { error: "Unknown stage or sub-status" };
  if (!subStatus) {
    const firstActive = [...stage.subStatuses]
      .filter((s) => s.active)
      .sort((a, b) => a.order - b.order)[0];
    if (!firstActive) return { error: "Unknown stage or sub-status" };
    return { status: stage.key, subStatus: firstActive.key };
  }
  const sub = findSubStatusByKeyOrLabel(stage, subStatus);
  if (!sub || !sub.active) return { error: "Unknown stage or sub-status" };
  return { status: stage.key, subStatus: sub.key };
};

export const importLeads = async (
  rows: ImportRow[],
  options: ImportOptions,
): Promise<ImportResponse> => {
  const records: RowRecord[] = [];
  const programRequests: { index: number; kind: LeadProgramKind; slug: string; brand: Brand }[] = [];

  // Pass 1: pure field validation, plus the pipeline pair (in-memory cache, no per-row query).
  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 1;
    const fields = validateFields(rows[i] ?? {});
    if (!fields.ok) {
      records.push({ row: rowNumber, outcome: "error", error: fields.error });
      continue;
    }

    const pair = await resolveStatusPair(fields.status, fields.subStatus);
    if ("error" in pair) {
      records.push({ row: rowNumber, outcome: "error", error: pair.error });
      continue;
    }

    records.push({
      row: rowNumber,
      outcome: "ok",
      data: {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        brand: fields.brand,
        collegeName: fields.collegeName,
        state: fields.state,
        answers: fields.answers,
        status: pair.status,
        subStatus: pair.subStatus,
      },
    });

    if (fields.program) {
      programRequests.push({
        index: records.length - 1,
        kind: fields.program.kind,
        slug: fields.program.slug,
        brand: fields.brand,
      });
    }
  }

  // Pass 2: resolve every requested course/internship, one query per (kind, brand) pair.
  if (programRequests.length > 0) {
    const courseSlugsByBrand = new Map<Brand, Set<string>>();
    const internshipSlugsByBrand = new Map<Brand, Set<string>>();
    for (const req of programRequests) {
      const map = req.kind === "course" ? courseSlugsByBrand : internshipSlugsByBrand;
      if (!map.has(req.brand)) map.set(req.brand, new Set());
      map.get(req.brand)!.add(req.slug);
    }

    const courseMap = new Map<string, { refId: mongoose.Types.ObjectId; title: string }>();
    const internshipMap = new Map<string, { refId: mongoose.Types.ObjectId; title: string }>();

    await Promise.all([
      ...[...courseSlugsByBrand.entries()].map(async ([brand, slugs]) => {
        const docs = await CourseModel.find(
          { brand, slug: { $in: [...slugs] } },
          { slug: 1, title: 1 },
        ).lean();
        for (const doc of docs as { _id: unknown; slug: string; title?: string }[]) {
          courseMap.set(`${brand}::${doc.slug}`, {
            refId: doc._id as mongoose.Types.ObjectId,
            title: String(doc.title ?? ""),
          });
        }
      }),
      ...[...internshipSlugsByBrand.entries()].map(async ([brand, slugs]) => {
        const docs = await InternshipModel.find(
          { brand, slug: { $in: [...slugs] } },
          { slug: 1, title: 1 },
        ).lean();
        for (const doc of docs as { _id: unknown; slug: string; title?: string }[]) {
          internshipMap.set(`${brand}::${doc.slug}`, {
            refId: doc._id as mongoose.Types.ObjectId,
            title: String(doc.title ?? ""),
          });
        }
      }),
    ]);

    for (const req of programRequests) {
      const record = records[req.index];
      if (record.outcome !== "ok" || !record.data) continue;
      const map = req.kind === "course" ? courseMap : internshipMap;
      const found = map.get(`${req.brand}::${req.slug}`);
      if (!found) {
        record.outcome = "error";
        record.error = `No ${req.kind} found for that slug on ${req.brand}`;
        record.data = undefined;
        continue;
      }
      record.data.program = {
        kind: req.kind,
        refId: found.refId,
        title: found.title,
        slug: req.slug,
      };
    }
  }

  // Pass 3: duplicates, one batched query per brand plus an in-file check, in row order.
  const okByBrand = new Map<Brand, RowRecord[]>();
  for (const record of records) {
    if (record.outcome !== "ok" || !record.data) continue;
    if (!okByBrand.has(record.data.brand)) okByBrand.set(record.data.brand, []);
    okByBrand.get(record.data.brand)!.push(record);
  }

  await Promise.all(
    [...okByBrand.entries()].map(async ([brand, brandRecords]) => {
      const emails = [...new Set(brandRecords.map((r) => r.data!.email))];
      const phones = [...new Set(brandRecords.map((r) => r.data!.phone))];

      const existing = await LeadModel.find(
        {
          "source.brand": brand,
          $or: [{ email: { $in: emails } }, { phone: { $in: phones } }],
        },
        { email: 1, phone: 1 },
      ).lean();
      const existingEmails = new Set(existing.map((l) => l.email));
      const existingPhones = new Set(existing.map((l) => l.phone));

      const seenEmails = new Set<string>();
      const seenPhones = new Set<string>();
      for (const record of brandRecords) {
        const { email, phone } = record.data!;
        if (
          existingEmails.has(email) ||
          existingPhones.has(phone) ||
          seenEmails.has(email) ||
          seenPhones.has(phone)
        ) {
          record.outcome = "duplicate";
          continue;
        }
        seenEmails.add(email);
        seenPhones.add(phone);
      }
    }),
  );

  // Insert, unless this is a dry run.
  let created = 0;
  if (!options.dryRun) {
    const toInsert = records.filter((r) => r.outcome === "ok" && r.data);
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK_SIZE);
      const docs = chunk.map((r) => {
        const d = r.data!;
        return {
          status: d.status,
          subStatus: d.subStatus,
          source: {
            kind: "import",
            brand: d.brand,
            fileName: options.fileName,
            importedBy: options.importedBy,
            ...(d.program ? { program: d.program } : {}),
          },
          name: d.name,
          email: d.email,
          phone: d.phone,
          answers: d.answers,
          ...(d.collegeName ? { collegeName: d.collegeName } : {}),
          ...(d.state ? { state: d.state } : {}),
        };
      });

      try {
        const inserted = await LeadModel.insertMany(docs, { ordered: false });
        created += inserted.length;
      } catch (error) {
        // ordered:false keeps going past a bad doc; salvage what went in and
        // flag only the ones that actually failed, rather than the whole chunk.
        const bulkError = error as {
          insertedDocs?: unknown[];
          writeErrors?: { index: number; errmsg?: string }[];
        };
        created += bulkError.insertedDocs?.length ?? 0;
        const failedIndexes = new Set((bulkError.writeErrors ?? []).map((w) => w.index));
        chunk.forEach((r, idx) => {
          if (failedIndexes.has(idx)) {
            r.outcome = "error";
            r.error = "Failed to save";
          }
        });
      }
    }
  }

  const results: ImportRowResult[] = records.map((r) => ({
    row: r.row,
    outcome: r.outcome,
    ...(r.error ? { error: r.error } : {}),
  }));

  const summary: ImportSummary = { ok: 0, duplicate: 0, error: 0 };
  for (const r of results) summary[r.outcome] += 1;

  return { results, summary, created };
};
