/**
 * Grouped certificates for the "My Certificates" page: one entry per course
 * or internship, holding every document issued for it.
 */
export type CertificateProgramType = "course" | "internship";

export type CertificateDocumentKind =
  | "training"
  | "lor"
  | "offer-letter"
  | "internship";

export interface CertificateDocument {
  kind: CertificateDocumentKind;
  label: string;
  fileUrl: string;
  issuedAt: string;
  verificationUrl: string | null;
}

export interface CertificateGroup {
  programType: CertificateProgramType;
  programId: string;
  title: string;
  thumbnail: string | null;
  latestIssuedAt: string;
  documents: CertificateDocument[];
}
