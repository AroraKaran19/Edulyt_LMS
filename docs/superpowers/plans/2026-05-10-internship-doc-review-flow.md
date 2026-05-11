# Internship Documentation Review & Offer Letter Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the instant doc-submit-to-enrolled shortcut with a proper admin review gate, a cron-driven offer-letter queue, and a resubmission loop for rejected docs.

**Architecture:** Three new statuses (`docs_under_review`, `offer_letter_pending`, `re_pending_documentation`) slot between `pending_documentation` and `enrolled`. Learner submission moves enrollment to `docs_under_review`; a dedicated admin verify endpoint approves (→ `offer_letter_pending`) or rejects (→ `re_pending_documentation`); the existing doc-submit endpoint accepts both `pending_documentation` and `re_pending_documentation` for resubmission; a 15-minute cron drains `offer_letter_pending`, generates a DOCX offer letter by filling the existing template, uploads it to S3, stores the URL in `offerLetterUrl`, and transitions to `enrolled`.

**Tech Stack:** TypeScript, Mongoose, Express, node-cron, PizZip, aws-sdk

**Offer letter template:** `frontend/public/course-certificates/Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/types/internship-enrollment.ts` | Modify | Add 3 statuses; 6 new optional fields to `InternshipEnrollment`; 4 new fields to `InternshipEnrollmentListRow` |
| `backend/src/models/internshipEnrollment.schema.ts` | Modify | Add 3 statuses to enum; 6 new schema fields |
| `backend/src/services/internshipEnrollment.services.ts` | Modify | 7 changes — see tasks below |
| `backend/src/controllers/internshipEnrollment.controller.ts` | Modify | Add `adminVerifyInternshipDocumentationController` |
| `backend/src/routes/internshipEnrollment.routes.ts` | Modify | Import + register new verify route |
| `backend/src/services/cron.services.ts` | Modify | Add full offer-letter generation cron |

---

## Task 1: Types and Schema

**Files:**
- Modify: `backend/src/types/internship-enrollment.ts`
- Modify: `backend/src/models/internshipEnrollment.schema.ts`

---

- [ ] **Step 1.1 — Add 3 new statuses to `InternshipEnrollmentStatus`**

In `backend/src/types/internship-enrollment.ts`, replace lines 45–56:

```typescript
export type InternshipEnrollmentStatus =
  | "exam_registered"           // merit: form submitted, waiting for exam date
  | "exam_attempted"            // merit: exam submitted, result pending
  | "in_merit_pool"             // merit: passed threshold, awaiting admin seat selection
  | "admin_rejected"            // merit: admin did not select this candidate (terminal)
  | "payment_pending"           // paid: payment initiated, awaiting gateway confirmation
  | "pending_documentation"     // both paths: selected, awaiting Aadhar + photo upload
  | "docs_under_review"         // both paths: learner submitted docs, awaiting admin verification
  | "offer_letter_pending"      // both paths: admin approved docs, cron will generate offer letter and enroll
  | "re_pending_documentation"  // both paths: admin rejected docs, learner must resubmit
  | "enrolled"                  // both paths: fully active enrollment
  | "completed"                 // post-enrollment: program finished
  | "dropped"                   // post-enrollment: voluntary withdrawal
  | "revoked"                   // post-enrollment: admin-forced removal
  | "paused";                   // post-enrollment: temporarily frozen
```

---

- [ ] **Step 1.2 — Add 6 new optional fields to `InternshipEnrollment` interface**

In `backend/src/types/internship-enrollment.ts`, add after the `documentation?` field (around line 183):

```typescript
  /** `User._id` of the admin who approved or rejected the submitted documentation. */
  documentationReviewedBy?: string;

  /** Timestamp when the admin reviewed (approved or rejected) the submitted documentation. */
  documentationReviewedAt?: Date;

  /** Rejection note set by admin when sending enrollment back to `re_pending_documentation`. */
  documentationRejectionNote?: string;

  /** Timestamp set by the offer-letter cron when it processed this enrollment. */
  offerLetterGeneratedAt?: Date;

  /**
   * Unique intern identifier assigned by the offer-letter cron, format: AI-XXXXX.
   * Printed on the generated offer letter.
   */
  internId?: string;

  /** Public S3 URL of the generated offer letter DOCX. Set by the offer-letter cron. */
  offerLetterUrl?: string;
```

---

- [ ] **Step 1.3 — Add 4 new fields to `InternshipEnrollmentListRow`**

In `backend/src/types/internship-enrollment.ts`, add after the `documentation?` field in `InternshipEnrollmentListRow` (around line 150):

```typescript
  /**
   * Rejection note written by admin when sending docs back for resubmission.
   * Returned on both admin and learner responses.
   */
  documentationRejectionNote?: string;

  /** ISO — when the offer-letter cron processed this enrollment. Admin-facing. */
  offerLetterGeneratedAt?: string;

  /** Unique intern ID assigned at offer-letter generation (e.g. "AI-00042"). Admin-facing. */
  internId?: string;

  /** Public S3 URL of the generated offer letter DOCX. Admin-facing. */
  offerLetterUrl?: string;
```

---

- [ ] **Step 1.4 — Add 3 new statuses to Mongoose schema enum**

In `backend/src/models/internshipEnrollment.schema.ts`, replace the `status` field (lines 59–76):

```typescript
    status: {
      type: String,
      enum: [
        "exam_registered",
        "exam_attempted",
        "in_merit_pool",
        "admin_rejected",
        "payment_pending",
        "pending_documentation",
        "docs_under_review",
        "offer_letter_pending",
        "re_pending_documentation",
        "enrolled",
        "completed",
        "dropped",
        "revoked",
        "paused",
      ],
      required: true,
      default: "enrolled",
    },
```

---

- [ ] **Step 1.5 — Add 6 new schema fields**

In `backend/src/models/internshipEnrollment.schema.ts`, add after the closing `},` of the `documentation` sub-schema block (after line ~149):

```typescript
    documentationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    documentationReviewedAt: { type: Date },
    documentationRejectionNote: { type: String, trim: true },
    offerLetterGeneratedAt: { type: Date },
    internId: { type: String, trim: true, sparse: true },
    offerLetterUrl: { type: String, trim: true },
```

---

- [ ] **Step 1.6 — Verify TypeScript compiles**

```
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

- [ ] **Step 1.7 — Commit**

```
git add backend/src/types/internship-enrollment.ts backend/src/models/internshipEnrollment.schema.ts
git commit -m "feat: add docs_under_review, offer_letter_pending, re_pending_documentation statuses and schema fields"
```

---

## Task 2: Update Doc Submission Service

**Files:**
- Modify: `backend/src/services/internshipEnrollment.services.ts` (around lines 2490–2580)

---

- [ ] **Step 2.1 — Widen the status guard to accept both learner-submittable statuses**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 2534–2538:

```typescript
  if (
    String(doc.status) !== "pending_documentation" &&
    String(doc.status) !== "re_pending_documentation"
  ) {
    throw new AppError(
      `Cannot submit documents from status "${doc.status}"`,
      400,
    );
  }
```

---

- [ ] **Step 2.2 — Change the status transition target from `enrolled` to `docs_under_review`**

In `backend/src/services/internshipEnrollment.services.ts`, replace line 2574:

```typescript
  doc.status = "docs_under_review" as typeof doc.status;
```

---

- [ ] **Step 2.3 — Update the JSDoc comment above `submitInternshipDocumentation`**

Replace lines 2490–2498:

```typescript
/**
 * Learner submits Aadhar + photo from `pending_documentation` or
 * `re_pending_documentation`, transitioning the enrollment to
 * `docs_under_review` for admin review. Submissions outside the configured
 * window are rejected with `DOCUMENTATION_WINDOW_NOT_OPEN` /
 * `DOCUMENTATION_WINDOW_CLOSED`.
 *
 * Aadhar is encrypted at the application layer (AES-256-GCM); only the
 * ciphertext + IV + tag are persisted.
 */
```

---

- [ ] **Step 2.4 — Verify TypeScript compiles**

```
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

- [ ] **Step 2.5 — Commit**

```
git add backend/src/services/internshipEnrollment.services.ts
git commit -m "feat: doc submission transitions to docs_under_review, accepts re_pending_documentation"
```

---

## Task 3: Update Transitions Map, Lifecycle Groups, and Add Verify Service

**Files:**
- Modify: `backend/src/services/internshipEnrollment.services.ts` (multiple sections)

---

- [ ] **Step 3.1 — Update `ALLOWED_ADMIN_TRANSITIONS`**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 1689–1704:

```typescript
const ALLOWED_ADMIN_TRANSITIONS: Record<string, string[]> = {
  exam_registered: ["exam_attempted", "in_merit_pool", "admin_rejected"],
  exam_attempted: ["in_merit_pool", "admin_rejected"],
  in_merit_pool: ["enrolled", "admin_rejected"],
  payment_pending: ["admin_rejected"],
  pending_documentation: ["docs_under_review", "enrolled", "admin_rejected", "revoked"],
  docs_under_review: ["offer_letter_pending", "re_pending_documentation", "enrolled", "admin_rejected", "revoked"],
  offer_letter_pending: ["enrolled", "revoked"],
  re_pending_documentation: ["docs_under_review", "pending_documentation", "enrolled", "admin_rejected", "revoked"],
  enrolled: ["completed", "paused", "revoked"],
  paused: ["enrolled", "revoked", "completed"],
};
```

---

- [ ] **Step 3.2 — Add the 3 new statuses to `PROGRAM_STATUSES` in `listInternshipEnrollmentsAdmin`**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 191–197:

```typescript
  const PROGRAM_STATUSES = [
    "pending_documentation",
    "docs_under_review",
    "offer_letter_pending",
    "re_pending_documentation",
    "enrolled",
    "completed",
    "paused",
    "dropped",
    "revoked",
  ] as const;
```

---

- [ ] **Step 3.3 — Extend doc-window fetch in `listMyInternshipEnrollments` to include new statuses**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 1056–1058:

```typescript
  const docsRows = (raw as Record<string, unknown>[]).filter(
    (d) =>
      (String(d.status ?? "") === "pending_documentation" ||
        String(d.status ?? "") === "docs_under_review" ||
        String(d.status ?? "") === "re_pending_documentation") &&
      d.internship,
  );
```

---

- [ ] **Step 3.4 — Spread doc-window and `documentationRejectionNote` in learner listing return**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 1473–1476:

```typescript
      ...(
        (statusStr === "pending_documentation" ||
          statusStr === "docs_under_review" ||
          statusStr === "re_pending_documentation") &&
        internshipIdFromRef
          ? docsWindowByInternshipId.get(internshipIdFromRef) ?? {}
          : {}
      ),
      ...(paymentPendingContext ? { paymentPendingContext } : {}),
      ...(typeof (doc as Record<string, unknown>).documentationRejectionNote === "string"
        ? { documentationRejectionNote: (doc as Record<string, unknown>).documentationRejectionNote as string }
        : {}),
```

---

- [ ] **Step 3.5 — Add `documentationRejectionNote`, `offerLetterGeneratedAt`, `internId`, `offerLetterUrl` to `getInternshipEnrollmentByIdAdmin` return**

In `backend/src/services/internshipEnrollment.services.ts`, replace lines 504–507 (the `documentation:` line and closing `};`):

```typescript
    documentation: decryptDocumentationForAdmin(
      (doc as { documentation?: unknown }).documentation,
    ),
    documentationRejectionNote:
      typeof (doc as { documentationRejectionNote?: string }).documentationRejectionNote === "string"
        ? (doc as { documentationRejectionNote: string }).documentationRejectionNote
        : undefined,
    offerLetterGeneratedAt: toIso(
      (doc as { offerLetterGeneratedAt?: Date }).offerLetterGeneratedAt,
    ),
    internId:
      typeof (doc as { internId?: string }).internId === "string"
        ? (doc as { internId: string }).internId
        : undefined,
    offerLetterUrl:
      typeof (doc as { offerLetterUrl?: string }).offerLetterUrl === "string"
        ? (doc as { offerLetterUrl: string }).offerLetterUrl
        : undefined,
  };
}
```

---

- [ ] **Step 3.6 — Add `adminVerifyInternshipDocumentation` service function**

At the end of `backend/src/services/internshipEnrollment.services.ts` (after the closing `}` of `adminUpdateInternshipDocumentation` at line ~2693), append:

```typescript
/**
 * Admin: approve or reject submitted documentation from a `docs_under_review`
 * enrollment.
 *
 *  • approve → `offer_letter_pending`   (cron will generate offer letter and enroll)
 *  • reject  → `re_pending_documentation` (learner must resubmit via the same endpoint)
 *
 * Records `documentationReviewedBy` and `documentationReviewedAt` in both cases.
 * When rejecting, `documentationRejectionNote` is persisted (optional but recommended).
 */
export async function adminVerifyInternshipDocumentation(
  enrollmentId: string,
  action: "approve" | "reject",
  adminUserId: mongoose.Types.ObjectId,
  rejectionNote?: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  if (String(doc.status) !== "docs_under_review") {
    throw new AppError(
      `Documentation can only be verified when status is "docs_under_review". Current status: "${doc.status}"`,
      400,
    );
  }

  if (!doc.documentation) {
    throw new AppError(
      "No documentation found on this enrollment to verify",
      400,
    );
  }

  const now = new Date();
  (doc as unknown as Record<string, unknown>).documentationReviewedBy = adminUserId;
  (doc as unknown as Record<string, unknown>).documentationReviewedAt = now;

  if (action === "approve") {
    doc.status = "offer_letter_pending" as typeof doc.status;
  } else {
    doc.status = "re_pending_documentation" as typeof doc.status;
    if (rejectionNote) {
      (doc as unknown as Record<string, unknown>).documentationRejectionNote = rejectionNote;
    }
  }

  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}
```

---

- [ ] **Step 3.7 — Verify TypeScript compiles**

```
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

- [ ] **Step 3.8 — Commit**

```
git add backend/src/services/internshipEnrollment.services.ts
git commit -m "feat: add admin doc verify service, update transitions and lifecycle groups"
```

---

## Task 4: Controller and Route

**Files:**
- Modify: `backend/src/controllers/internshipEnrollment.controller.ts`
- Modify: `backend/src/routes/internshipEnrollment.routes.ts`

---

- [ ] **Step 4.1 — Import `adminVerifyInternshipDocumentation` in the controller**

In `backend/src/controllers/internshipEnrollment.controller.ts`, find the import that includes `adminUpdateInternshipDocumentation` from the services file and add `adminVerifyInternshipDocumentation` to it.

---

- [ ] **Step 4.2 — Add the controller function after `adminUpdateInternshipDocumentationController`**

```typescript
/**
 * @route   POST /api/internship-enrollments/admin/:enrollmentId/documentation/verify
 * @desc    Admin approves or rejects submitted documentation on a docs_under_review enrollment
 * @body    { action: "approve" | "reject", rejectionNote?: string }
 * @access  Admin
 */
export const adminVerifyInternshipDocumentationController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminUserId = req.user?._id;
    if (!adminUserId) throw new AppError("Unauthorized", 401);

    const enrollmentId = String(req.params.enrollmentId ?? "").trim();
    if (!enrollmentId) throw new AppError("enrollmentId is required", 400);

    const { action, rejectionNote } = req.body as {
      action?: string;
      rejectionNote?: string;
    };

    if (action !== "approve" && action !== "reject") {
      throw new AppError('action must be "approve" or "reject"', 400);
    }

    const row = await adminVerifyInternshipDocumentation(
      enrollmentId,
      action,
      new mongoose.Types.ObjectId(String(adminUserId)),
      typeof rejectionNote === "string" ? rejectionNote : undefined,
    );

    const message =
      action === "approve"
        ? "Documentation approved — enrollment queued for offer letter"
        : "Documentation rejected — learner must resubmit";
    sendSuccessResponse(res, row, message, 200);
  },
);
```

---

- [ ] **Step 4.3 — Add route in `internshipEnrollment.routes.ts`**

Import `adminVerifyInternshipDocumentationController` in the import block at the top, then add:

```typescript
/** POST /api/internship-enrollments/admin/:enrollmentId/documentation/verify */
router.post(
  "/admin/:enrollmentId/documentation/verify",
  verifyAdmin,
  adminVerifyInternshipDocumentationController,
);
```

---

- [ ] **Step 4.4 — Verify TypeScript compiles**

```
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

- [ ] **Step 4.5 — Commit**

```
git add backend/src/controllers/internshipEnrollment.controller.ts backend/src/routes/internshipEnrollment.routes.ts
git commit -m "feat: add POST /admin/:enrollmentId/documentation/verify endpoint"
```

---

## Task 5: Offer-Letter Cron Job (with actual DOCX generation)

**Files:**
- Modify: `backend/src/services/cron.services.ts`

**Template:** `frontend/public/course-certificates/Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx`

**Template XML analysis** — placeholders in the DOCX (confirmed by XML inspection):
| Placeholder in template | Type | XML structure |
|------------------------|------|---------------|
| `AI-XXXX` | intern ID | Single `<w:t>` node — simple replace |
| `DD - MM - YYYY` (header, no brackets) | letter date | 5 split runs: `DD`, `-`, `MM`, `-`, `YYYY` |
| `[Your Name]` | learner name | 4 runs: `[`, `Your `, `Name`, `]` |
| `[DD-MMM-YYYY]` | joining date | 3 runs: `[`, `DD-MMM-YYYY`, `]` |
| `[Your selected Domain (eg Data Analyst) Intern]` | domain + "Intern" | 6 runs inside `[...]` |
| `[X]` | duration months | 3 runs: `[`, `X`, `]` |

**Replacement strategy:**
- `AI-XXXX` → direct `<w:t>` string replace
- Date header → regex spanning 5 `<w:t>` nodes: `<w:t>DD</w:t>...<w:t>YYYY</w:t>`
- All 4 bracketed placeholders → one global regex `/<w:t>\[<\/w:t>[\s\S]*?<w:t>\]<\/w:t>/g` applied sequentially (they appear in the order: name, joiningDate, domain, duration)

The regex approach works because:
- `<w:r><w:rPr>PROPS</w:rPr><w:t>[</w:t></w:r>MIDDLE<w:r><w:rPr>PROPS</w:rPr><w:t>]</w:t></w:r>`
- Regex matches from `<w:t>[</w:t>` through `<w:t>]</w:t>`, stripping the middle XML
- The `<w:r><w:rPr>PROPS</w:rPr>` before `[` and `</w:r>` after `]` are preserved → valid XML

---

- [ ] **Step 5.1 — Add imports to `cron.services.ts`**

At the top of `backend/src/services/cron.services.ts`, add after the existing imports:

```typescript
import * as fs from "fs";
import * as path from "path";
import PizZip from "pizzip";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { UserModel } from "../models/user.schema";
import { uploadFileToS3 } from "./upload.services";
```

---

- [ ] **Step 5.2 — Add helper: `escapeXml`**

```typescript
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

---

- [ ] **Step 5.3 — Add helper: `formatOfferLetterDate`**

```typescript
function formatOfferLetterDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}
```

---

- [ ] **Step 5.4 — Add helper: `generateInternId`**

Intern IDs follow the format `AI-XXXXX` (zero-padded, 5 digits). Assigns the next available number by counting how many enrollments already have an `internId`.

```typescript
async function generateInternId(): Promise<string> {
  const count = await InternshipEnrollmentModel.countDocuments({
    internId: { $exists: true, $ne: null },
  });
  return `AI-${String(count + 1).padStart(5, "0")}`;
}
```

---

- [ ] **Step 5.5 — Add helper: `fillOfferLetterXml`**

```typescript
function fillOfferLetterXml(
  xml: string,
  data: {
    letterDate: string;  // e.g. "10-May-2026"
    name: string;        // e.g. "Karan Arora"
    internId: string;    // e.g. "AI-00042"
    joiningDate: string; // e.g. "10-May-2026"
    domain: string;      // e.g. "Data Science Intern"
    duration: string;    // e.g. "3"
  },
): string {
  const e = escapeXml;

  // 1. Intern ID — confirmed single <w:t> node in template XML
  xml = xml.replace("<w:t>AI-XXXX</w:t>", `<w:t>${e(data.internId)}</w:t>`);

  // 2. Letter date header "DD - MM - YYYY" — confirmed 5 split runs
  xml = xml.replace(
    /<w:t>DD<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>MM<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>YYYY<\/w:t>/,
    `<w:t>${e(data.letterDate)}</w:t>`,
  );

  // 3–6. Four bracketed placeholders appear in this order in the template:
  //   [Your Name], [DD-MMM-YYYY], [Your selected Domain (eg Data Analyst) Intern], [X]
  // Each is split across runs: <w:t>[</w:t>...inner runs...<w:t>]</w:t>
  // The regex strips the middle runs, leaving the value inside the first run's <w:r> wrapper.
  let idx = 0;
  const values = [e(data.name), e(data.joiningDate), e(data.domain), e(data.duration)];
  xml = xml.replace(
    /<w:t>\[<\/w:t>[\s\S]*?<w:t>\]<\/w:t>/g,
    () => `<w:t>${values[idx++] ?? ""}</w:t>`,
  );

  return xml;
}
```

---

- [ ] **Step 5.6 — Add helper: `generateOfferLetterBuffer`**

```typescript
const OFFER_LETTER_TEMPLATE = path.resolve(
  __dirname,
  "../../frontend/public/course-certificates/Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx",
);

function generateOfferLetterBuffer(data: Parameters<typeof fillOfferLetterXml>[1]): Buffer {
  const templateBuffer = fs.readFileSync(OFFER_LETTER_TEMPLATE);
  const zip = new PizZip(templateBuffer);
  const docXml = zip.file("word/document.xml")!.asText();
  zip.file("word/document.xml", fillOfferLetterXml(docXml, data));
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
}
```

---

- [ ] **Step 5.7 — Add `processOfferLetterQueue` function**

```typescript
const processOfferLetterQueue = async () => {
  const pending = await InternshipEnrollmentModel.find({
    status: "offer_letter_pending",
  }).lean();

  if (pending.length === 0) return;
  console.log(`[offer-letter-cron] Processing ${pending.length} enrollment(s)`);

  for (const row of pending) {
    try {
      const doc = await InternshipEnrollmentModel.findById(row._id);
      if (!doc || String(doc.status) !== "offer_letter_pending") continue;

      const userDoc = await UserModel.findById(doc.user)
        .select("firstName lastName name")
        .lean();
      const name = userDoc
        ? (
            [
              (userDoc as { firstName?: string }).firstName,
              (userDoc as { lastName?: string }).lastName,
            ]
              .filter(Boolean)
              .join(" ") || (userDoc as { name?: string }).name || "Intern"
          )
        : "Intern";

      const existing = (doc as unknown as Record<string, unknown>).internId as string | undefined;
      const internId = existing ?? (await generateInternId());

      const now = new Date();
      const joiningDate = doc.enrolledAt instanceof Date
        ? formatOfferLetterDate(doc.enrolledAt)
        : formatOfferLetterDate(now);

      const rawTitle = doc.internshipSnapshot?.title ?? "";
      const domain = rawTitle ? `${rawTitle} Intern` : "Intern";

      const programMonths = (doc as unknown as Record<string, unknown>).programDurationMonths;
      const duration = String(typeof programMonths === "number" ? programMonths : 3);

      const docxBuffer = generateOfferLetterBuffer({
        letterDate: formatOfferLetterDate(now),
        name,
        internId,
        joiningDate,
        domain,
        duration,
      });

      const offerLetterUrl = await uploadFileToS3(
        docxBuffer,
        `offer-letter-${internId}.docx`,
        "offer-letters",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      (doc as unknown as Record<string, unknown>).internId = internId;
      (doc as unknown as Record<string, unknown>).offerLetterGeneratedAt = now;
      (doc as unknown as Record<string, unknown>).offerLetterUrl = offerLetterUrl;
      if (!(doc.enrolledAt instanceof Date)) {
        doc.enrolledAt = now;
      }
      doc.status = "enrolled" as typeof doc.status;
      await doc.save();

      console.log(`[offer-letter-cron] Enrolled ${String(doc._id)} as ${internId} — offer letter: ${offerLetterUrl}`);
    } catch (err) {
      console.error(`[offer-letter-cron] Failed for ${String(row._id)}:`, err);
    }
  }
};
```

---

- [ ] **Step 5.8 — Register the cron inside `initializeCronJobs`**

In `backend/src/services/cron.services.ts`, inside `initializeCronJobs` (after the existing payment cron block, around line 238), add:

```typescript
  // Process offer-letter queue every 15 minutes
  cron.schedule(
    "*/15 * * * *",
    () => {
      console.log("⏰ Running offer-letter queue cron job...");
      processOfferLetterQueue();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("  - Offer-letter queue: Every 15 minutes");
```

---

- [ ] **Step 5.9 — Verify TypeScript compiles**

```
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

- [ ] **Step 5.10 — Commit**

```
git add backend/src/services/cron.services.ts
git commit -m "feat: offer letter cron — fill DOCX template, upload to S3, enroll learner"
```

---

## Flow Summary (after implementation)

```
pending_documentation
    │
    │ learner submits docs (POST /me/:id/documentation)
    ▼
docs_under_review
    │
    ├─ admin approves (POST /admin/:id/documentation/verify  { action:"approve" })
    │       ▼
    │   offer_letter_pending
    │       │
    │       │ cron every 15 min:
    │       │   • fills DOCX template with learner name / internId / domain / dates
    │       │   • uploads to S3  →  stores offerLetterUrl
    │       │   • assigns internId (AI-XXXXX)
    │       │   • sets enrolledAt, offerLetterGeneratedAt
    │       ▼
    │   enrolled
    │
    └─ admin rejects (POST /admin/:id/documentation/verify  { action:"reject", rejectionNote? })
            ▼
        re_pending_documentation
            │
            │ learner resubmits (same POST /me/:id/documentation)
            ▼
        docs_under_review  (cycle repeats)
```

**Offer letter data mapping:**

| Template placeholder | Source field |
|---------------------|-------------|
| `AI-XXXX` | `internId` (auto-generated `AI-XXXXX`) |
| `DD - MM - YYYY` (header) | today's date |
| `[Your Name]` | `user.firstName + user.lastName` |
| `[DD-MMM-YYYY]` | `enrolledAt` (or today if not set) |
| `[Your selected Domain...]` | `internshipSnapshot.title + " Intern"` |
| `[X]` | `programDurationMonths` (defaults to 3) |
