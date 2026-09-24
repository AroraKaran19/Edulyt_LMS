import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipModel } from "../models/internship.schema";
import { CrmProfileModel, UserModel } from "../models";
import { BRANDS, type Brand } from "../constants/brands";
import { crmRoleOf } from "./crmProfile.services";
import type { LeadAttribution } from "../lib/leadAttribution";
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
  creatorEmail?: unknown;
}

export type ImportOutcome = "ok" | "error";

export interface ImportRowResult {
  row: number;
  outcome: ImportOutcome;
  error?: string;
  /** Imported without a creator: the email matched no marketer, sales person or ambassador. */
  creatorNotFound?: boolean;
  /** Preview only: this email or phone is already a lead on the brand. */
  existing?: boolean;
}

export interface ImportSummary {
  ok: number;
  error: number;
  existing: number;
  creatorNotFound: number;
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
  /** Row numbers in results continue from here, so a job's chunks report file rows. */
  rowOffset?: number;
  jobId?: mongoose.Types.ObjectId;
  /** Only the first chunk of a resumed job can hold rows inserted before a crash. */
  mayHavePartialInsert?: boolean;
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
  creatorEmail?: string;
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

  const creatorEmail = String(row.creatorEmail ?? "").trim().toLowerCase();
  if (creatorEmail && !EMAIL_RE.test(creatorEmail)) {
    return { ok: false, error: "creatorEmail is not a valid email" };
  }

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
    creatorEmail: creatorEmail || undefined,
  };
};

interface RowRecord {
  row: number;
  outcome: ImportOutcome;
  error?: string;
  creatorEmail?: string;
  attribution?: LeadAttribution;
  creatorNotFound?: boolean;
  existing?: boolean;
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

const fullName = (u: { firstName?: string; lastName?: string } | null | undefined): string =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();

/** Creator email to the same creator/parent snapshot a lead from their link would carry. */
const resolveCreators = async (emails: string[]): Promise<Map<string, LeadAttribution>> => {
  const byEmail = new Map<string, LeadAttribution>();
  if (emails.length === 0) return byEmail;

  const users = await UserModel.find(
    { email: { $in: emails }, userType: { $in: ["marketer", "sales", "student"] } },
    { email: 1, userType: 1, firstName: 1, lastName: 1 },
  ).lean();
  if (users.length === 0) return byEmail;

  const profiles = await CrmProfileModel.find(
    { userId: { $in: users.map((u) => u._id) } },
    { userId: 1, code: 1, codeActive: 1, parentUserId: 1, ambassadorKind: 1 },
  ).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.userId), p]));

  const parentIds = [
    ...new Set(profiles.map((p) => (p.parentUserId ? String(p.parentUserId) : "")).filter(Boolean)),
  ];
  const parents = parentIds.length
    ? await UserModel.find({ _id: { $in: parentIds } }, { firstName: 1, lastName: 1 }).lean()
    : [];
  const parentName = new Map(parents.map((p) => [String(p._id), fullName(p)]));

  for (const user of users) {
    const profile = profileByUser.get(String(user._id));
    const hasLiveCode = Boolean(profile?.code) && profile?.codeActive !== false;
    // Staff are credited without a link; an ambassador needs a live one, as on the enquiry form.
    const role = crmRoleOf(
      user.userType,
      user.userType === "student" ? hasLiveCode : true,
      profile?.ambassadorKind ?? undefined,
    );
    if (!role) continue;

    const parentId = profile?.parentUserId ? String(profile.parentUserId) : "";
    byEmail.set(String(user.email).toLowerCase(), {
      creator: {
        userId: new mongoose.Types.ObjectId(String(user._id)),
        code: profile?.code ?? "",
        name: fullName(user),
        role,
      },
      ...(parentId && {
        parent: { userId: new mongoose.Types.ObjectId(parentId), name: parentName.get(parentId) ?? "" },
      }),
    });
  }
  return byEmail;
};

type ProgramRef = { refId: mongoose.Types.ObjectId; title: string };

const programKey = (kind: LeadProgramKind, brand: Brand, slug: string) =>
  `${kind}::${brand}::${slug}`;

/** One query per (kind, brand) pair for every program the rows name. */
const resolvePrograms = async (
  requests: { kind: LeadProgramKind; brand: Brand; slug: string }[],
): Promise<Map<string, ProgramRef>> => {
  const found = new Map<string, ProgramRef>();
  const slugsByKindBrand = new Map<string, { kind: LeadProgramKind; brand: Brand; slugs: Set<string> }>();
  for (const req of requests) {
    const key = `${req.kind}::${req.brand}`;
    if (!slugsByKindBrand.has(key)) {
      slugsByKindBrand.set(key, { kind: req.kind, brand: req.brand, slugs: new Set() });
    }
    slugsByKindBrand.get(key)!.slugs.add(req.slug);
  }

  await Promise.all(
    [...slugsByKindBrand.values()].map(async ({ kind, brand, slugs }) => {
      const Model = kind === "course" ? CourseModel : InternshipModel;
      const docs = await (Model as typeof CourseModel)
        .find({ brand, slug: { $in: [...slugs] } }, { slug: 1, title: 1 })
        .lean();
      for (const doc of docs as { _id: unknown; slug: string; title?: string }[]) {
        found.set(programKey(kind, brand, doc.slug), {
          refId: doc._id as mongoose.Types.ObjectId,
          title: String(doc.title ?? ""),
        });
      }
    }),
  );
  return found;
};

/** Lookups shared by every batch of one file, so a job resolves them once, not per batch. */
export interface ImportContext {
  programs: Map<string, ProgramRef>;
  creators: Map<string, LeadAttribution>;
}

export const buildImportContext = async (rows: ImportRow[]): Promise<ImportContext> => {
  const programRequests: { kind: LeadProgramKind; brand: Brand; slug: string }[] = [];
  const creatorEmails = new Set<string>();
  for (const row of rows) {
    const fields = validateFields(row ?? {});
    if (!fields.ok) continue;
    if (fields.program) programRequests.push({ ...fields.program, brand: fields.brand });
    if (fields.creatorEmail) creatorEmails.add(fields.creatorEmail);
  }
  const [programs, creators] = await Promise.all([
    resolvePrograms(programRequests),
    resolveCreators([...creatorEmails]),
  ]);
  return { programs, creators };
};

export const importLeads = async (
  rows: ImportRow[],
  options: ImportOptions,
  sharedContext?: ImportContext,
): Promise<ImportResponse> => {
  const context = sharedContext ?? (await buildImportContext(rows));
  const records: RowRecord[] = [];
  const programRequests: { index: number; kind: LeadProgramKind; slug: string; brand: Brand }[] = [];

  // Pass 1: pure field validation, plus the pipeline pair (in-memory cache, no per-row query).
  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = (options.rowOffset ?? 0) + i + 1;
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
      creatorEmail: fields.creatorEmail,
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

  // Pass 2: programs and creators, from lookups made once for the whole file.
  for (const req of programRequests) {
    const record = records[req.index];
    if (record.outcome !== "ok" || !record.data) continue;
    // Never rejects, as on the enquiry form: an unknown slug is kept as typed, without a title.
    const found = context.programs.get(programKey(req.kind, req.brand, req.slug));
    record.data.program = found
      ? { kind: req.kind, refId: found.refId, title: found.title, slug: req.slug }
      : { kind: req.kind, title: "", slug: req.slug };
  }

  const okRecords = records.filter((r) => r.outcome === "ok" && r.data);
  for (const record of okRecords) {
    if (!record.creatorEmail) continue;
    const attribution = context.creators.get(record.creatorEmail);
    if (attribution) record.attribution = attribution;
    else record.creatorNotFound = true;
  }

  // Pass 3 (preview only): repeats are imported like repeat enquiries, this only informs.
  if (options.dryRun) {
    const okByBrand = new Map<Brand, RowRecord[]>();
    for (const record of okRecords) {
      if (!okByBrand.has(record.data!.brand)) okByBrand.set(record.data!.brand, []);
      okByBrand.get(record.data!.brand)!.push(record);
    }
    await Promise.all(
      [...okByBrand.entries()].map(async ([brand, brandRecords]) => {
        const emails = [...new Set(brandRecords.map((r) => r.data!.email))];
        const phones = [...new Set(brandRecords.map((r) => r.data!.phone))];
        const existing = await LeadModel.find(
          { "source.brand": brand, $or: [{ email: { $in: emails } }, { phone: { $in: phones } }] },
          { email: 1, phone: 1 },
        ).lean();
        const existingEmails = new Set(existing.map((l) => l.email));
        const existingPhones = new Set(existing.map((l) => l.phone));
        for (const record of brandRecords) {
          const { email, phone } = record.data!;
          if (existingEmails.has(email) || existingPhones.has(phone)) record.existing = true;
        }
      }),
    );
  }

  let created = 0;
  if (!options.dryRun) {
    let toInsert = okRecords;
    if (options.jobId && options.mayHavePartialInsert && toInsert.length > 0) {
      // A resumed job re-runs the chunk it died in; rows that already went in are skipped.
      const done = await LeadModel.find(
        {
          "source.importJobId": options.jobId,
          "source.importRow": { $gte: toInsert[0].row, $lte: toInsert[toInsert.length - 1].row },
        },
        { "source.importRow": 1 },
      ).lean();
      const doneRows = new Set(done.map((l) => l.source?.importRow));
      created += doneRows.size;
      toInsert = toInsert.filter((r) => !doneRows.has(r.row));
    }

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
            ...(options.jobId ? { importJobId: options.jobId, importRow: r.row } : {}),
            ...(d.program ? { program: d.program } : {}),
          },
          ...(r.attribution ?? {}),
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
        // ordered:false keeps going past a bad doc; flag only the ones that failed.
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
    ...(r.outcome === "ok" && r.creatorNotFound ? { creatorNotFound: true } : {}),
    ...(r.outcome === "ok" && r.existing ? { existing: true } : {}),
  }));

  const summary: ImportSummary = { ok: 0, error: 0, existing: 0, creatorNotFound: 0 };
  for (const r of results) {
    summary[r.outcome] += 1;
    if (r.existing) summary.existing += 1;
    if (r.creatorNotFound) summary.creatorNotFound += 1;
  }

  return { results, summary, created };
};
