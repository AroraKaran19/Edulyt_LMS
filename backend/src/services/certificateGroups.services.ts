import mongoose from "mongoose";
import { CertificateModel } from "../models/certificate.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { CourseModel } from "../models/course.schema";
import type { Brand } from "../constants/brands";
import { verificationBaseUrl } from "../lib/verifyUrl";

export type CertificateDocKind = "training" | "lor" | "offer-letter" | "internship";

export interface CertificateGroupDoc {
  kind: CertificateDocKind;
  label: string;
  fileUrl: string;
  issuedAt: string;
  verificationUrl: string | null;
}

export interface CertificateGroup {
  programType: "course" | "internship";
  programId: string;
  title: string;
  thumbnail: string | null;
  latestIssuedAt: string;
  documents: CertificateGroupDoc[];
}

const ORDER: Record<CertificateDocKind, number> = { "offer-letter": 0, training: 1, internship: 1, lor: 2 };
const LABEL: Record<CertificateDocKind, string> = {
  training: "Training certificate",
  lor: "Letter of recommendation",
  "offer-letter": "Offer letter",
  internship: "Internship certificate",
};

type CertRow = {
  certificateType: "course" | "internship" | "lor";
  enrollmentModel: string;
  enrollmentId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId | null;
  fileUrl: string;
  issuedAt: Date;
  verificationUrl?: string | null;
};

type EnrollmentRow = {
  _id: mongoose.Types.ObjectId;
  internship: mongoose.Types.ObjectId;
  offerLetterUrl?: string;
  offerLetterGeneratedAt?: Date;
  internId?: string;
  createdAt?: Date;
};

/** One group per course or internship; CA documents excluded. */
export const getCertificateGroupsService = async (
  userId: string,
  brands?: Brand[],
): Promise<CertificateGroup[]> => {
  const certQuery: Record<string, unknown> = {
    userId,
    isActive: true,
    isLatest: true,
    enrollmentModel: { $ne: "CaApplication" },
  };
  if (brands?.length) certQuery.brand = { $in: brands };

  const [certs, enrollments] = await Promise.all([
    CertificateModel.find(certQuery, {
      certificateType: 1,
      enrollmentModel: 1,
      enrollmentId: 1,
      courseId: 1,
      fileUrl: 1,
      issuedAt: 1,
      verificationUrl: 1,
    }).lean<CertRow[]>(),
    InternshipEnrollmentModel.find(
      { user: userId, offerLetterUrl: { $exists: true, $nin: [null, ""] } },
      { internship: 1, offerLetterUrl: 1, offerLetterGeneratedAt: 1, createdAt: 1, internId: 1 },
    ).lean<EnrollmentRow[]>(),
  ]);

  const internshipEnrollmentIds = certs
    .filter((c) => c.enrollmentModel === "InternshipEnrollment")
    .map((c) => String(c.enrollmentId));
  const knownEnrollments = new Map(enrollments.map((e) => [String(e._id), e]));
  const missing = internshipEnrollmentIds.filter((id) => !knownEnrollments.has(id));
  if (missing.length) {
    const extra = await InternshipEnrollmentModel.find({ _id: { $in: missing } }, { internship: 1 }).lean<
      EnrollmentRow[]
    >();
    for (const e of extra) knownEnrollments.set(String(e._id), e);
  }

  const groups = new Map<string, CertificateGroup & { latest: number }>();
  const push = (
    programType: "course" | "internship",
    programId: string,
    doc: Omit<CertificateGroupDoc, "label">,
  ) => {
    const key = `${programType}:${programId}`;
    const group =
      groups.get(key) ??
      ({ programType, programId, title: "", thumbnail: null, latestIssuedAt: "", documents: [], latest: 0 } as CertificateGroup & {
        latest: number;
      });
    group.documents.push({ ...doc, label: LABEL[doc.kind] });
    group.latest = Math.max(group.latest, new Date(doc.issuedAt).getTime());
    groups.set(key, group);
  };

  for (const c of certs) {
    const doc = {
      fileUrl: c.fileUrl,
      issuedAt: new Date(c.issuedAt).toISOString(),
      verificationUrl: c.verificationUrl ?? null,
    };
    if (c.enrollmentModel === "InternshipEnrollment") {
      const enrollment = knownEnrollments.get(String(c.enrollmentId));
      if (!enrollment) continue;
      push("internship", String(enrollment.internship), {
        ...doc,
        kind: c.certificateType === "lor" ? "lor" : "internship",
      });
    } else if (c.courseId) {
      push("course", String(c.courseId), { ...doc, kind: c.certificateType === "lor" ? "lor" : "training" });
    }
  }

  for (const e of enrollments) {
    if (!e.offerLetterUrl) continue;
    push("internship", String(e.internship), {
      kind: "offer-letter",
      fileUrl: e.offerLetterUrl,
      issuedAt: new Date(e.offerLetterGeneratedAt ?? e.createdAt ?? Date.now()).toISOString(),
      // Same URL the letter's own QR encodes, so old letters verify too.
      verificationUrl: e.internId
        ? `${verificationBaseUrl("edulyt")}/verify/intern/${encodeURIComponent(e.internId)}`
        : null,
    });
  }

  const courseIds = [...groups.values()].filter((g) => g.programType === "course").map((g) => g.programId);
  const internshipIds = [...groups.values()].filter((g) => g.programType === "internship").map((g) => g.programId);
  const [courses, internships] = await Promise.all([
    courseIds.length
      ? CourseModel.find({ _id: { $in: courseIds } }, { title: 1, thumbnail: 1 }).lean<
          { _id: mongoose.Types.ObjectId; title?: string; thumbnail?: string }[]
        >()
      : [],
    internshipIds.length
      ? InternshipModel.find({ _id: { $in: internshipIds } }, { title: 1, thumbnail: 1 }).lean<
          { _id: mongoose.Types.ObjectId; title?: string; thumbnail?: string }[]
        >()
      : [],
  ]);
  const meta = new Map(
    [...courses, ...internships].map((p) => [String(p._id), { title: p.title ?? "", thumbnail: p.thumbnail ?? null }]),
  );

  return [...groups.values()]
    .map(({ latest, ...g }) => ({
      ...g,
      title: meta.get(g.programId)?.title ?? "",
      thumbnail: meta.get(g.programId)?.thumbnail ?? null,
      latestIssuedAt: new Date(latest).toISOString(),
      documents: g.documents.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]),
    }))
    .sort((a, b) => b.latestIssuedAt.localeCompare(a.latestIssuedAt));
};
