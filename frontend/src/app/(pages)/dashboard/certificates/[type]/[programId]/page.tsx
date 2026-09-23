"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle, Copy, Download, Linkedin } from "lucide-react";
import Loader from "@/components/ui/Loader";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useCertificateGroups from "@/hooks/useCertificateGroups";
import type {
  CertificateDocument,
  CertificateGroup,
  CertificateProgramType,
} from "@/types/certificateGroup";

const PROGRAM_PILL_STYLES: Record<CertificateProgramType, string> = {
  course: "bg-[#FFF6F2] text-[#E25C12] border border-[#F66F221F]",
  internship: "bg-indigo-50 text-[#4338CA] border border-indigo-100",
};

const PROGRAM_LABELS: Record<CertificateProgramType, string> = {
  course: "Course",
  internship: "Internship",
};

// LinkedIn's "Add to profile" flow only fits a training or internship certificate.
const LINKEDIN_ELIGIBLE_KINDS = new Set<CertificateDocument["kind"]>([
  "training",
  "internship",
]);

const formatIssuedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const buildLinkedInUrl = (doc: CertificateDocument, programmeTitle: string) => {
  const issued = new Date(doc.issuedAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${doc.label} - ${programmeTitle}`,
    organizationName: "Airkrit",
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
  });
  if (doc.verificationUrl) params.set("certUrl", doc.verificationUrl);
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
};

const CertificateDetailPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const { groups, isLoading, hasFetched, fetchCertificateGroups } =
    useCertificateGroups();

  const type = params?.type as string;
  const programId = params?.programId as string;
  const isValidType = type === "course" || type === "internship";
  const routeKey = `${type}-${programId}`;

  // Reset the tab and preview when navigating to a different certificate group,
  // without an effect: this component instance can persist across route params.
  const [prevRouteKey, setPrevRouteKey] = useState(routeKey);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  if (routeKey !== prevRouteKey) {
    setPrevRouteKey(routeKey);
    setSelectedIndex(0);
    setLoadedUrl(null);
  }

  useEffect(() => {
    fetchCertificateGroups();
  }, [fetchCertificateGroups]);

  const group = useMemo<CertificateGroup | undefined>(() => {
    if (!isValidType) return undefined;
    return groups.find(
      (g) => g.programType === type && g.programId === programId,
    );
  }, [groups, isValidType, type, programId]);

  const learnerName = session?.user?.firstName
    ? `${session.user.firstName} ${session.user.lastName ?? ""}`.trim()
    : session?.user?.email?.split("@")[0] || "Learner";

  if (!isValidType) {
    notFound();
  }

  if (!hasFetched || (isLoading && groups.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" variant="spinner" />
      </div>
    );
  }

  if (!group || group.documents.length === 0) {
    notFound();
  }

  const selectedDoc = group.documents[selectedIndex] ?? group.documents[0];
  const showLinkedIn = LINKEDIN_ELIGIBLE_KINDS.has(selectedDoc.kind);

  const handleCopyVerificationLink = async () => {
    if (!selectedDoc.verificationUrl) return;
    try {
      await navigator.clipboard.writeText(selectedDoc.verificationUrl);
      toast.success("Verification link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDownload = () => {
    if (!selectedDoc.fileUrl) return;
    window.open(selectedDoc.fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col min-h-[60vh] pb-24 sm:pb-6">
      <div className="py-4">
        <Link
          href="/dashboard/certificates"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="size-4" />
          My certificates
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
            {group.title}
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PROGRAM_PILL_STYLES[group.programType]}`}
          >
            {PROGRAM_LABELS[group.programType]}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Issued to {learnerName}</p>

        {/* Document switcher */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4">
          {group.documents.map((doc, index) => (
            <button
              key={`${doc.kind}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`shrink-0 flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left border transition-colors cursor-pointer ${
                index === selectedIndex
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-white border-[#0000001F] text-black hover:bg-gray-50"
              }`}
            >
              <span className="text-xs font-bold whitespace-nowrap">
                {doc.label}
              </span>
              <span
                className={`text-[10px] whitespace-nowrap ${index === selectedIndex ? "text-white/80" : "text-gray-500"}`}
              >
                {formatIssuedDate(doc.issuedAt)}
              </span>
            </button>
          ))}
        </div>

        {selectedDoc.verificationUrl && (
          <a
            href={selectedDoc.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 px-3 py-1 text-xs font-semibold mb-4 hover:bg-green-100 transition-colors w-fit"
          >
            <CheckCircle className="size-3.5" />
            Verified by Airkrit
          </a>
        )}

        {/* Preview */}
        <div className="w-full max-w-[600px] mx-auto">
          <div className="relative w-full aspect-[210/297] bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#0000001A] overflow-hidden">
            {selectedDoc.fileUrl && loadedUrl !== selectedDoc.fileUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <Loader size="lg" variant="spinner" />
              </div>
            )}
            {selectedDoc.fileUrl ? (
              <iframe
                key={selectedDoc.fileUrl}
                src={selectedDoc.fileUrl}
                title={selectedDoc.label}
                className="w-full h-full"
                onLoad={() => setLoadedUrl(selectedDoc.fileUrl)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 text-center px-4">
                Document not available
              </div>
            )}
          </div>

          {selectedDoc.fileUrl && (
            <a
              href={selectedDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-orange-600 hover:underline mt-2"
            >
              Open full document
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-[#0000001A] p-3 flex flex-wrap gap-2 justify-center sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-6">
          <OrangeButton
            onClick={handleDownload}
            disabled={!selectedDoc.fileUrl}
            className="px-4! py-2.5! text-sm"
          >
            <Download className="size-4" />
            Download
          </OrangeButton>

          {selectedDoc.verificationUrl && (
            <WhiteButton
              onClick={handleCopyVerificationLink}
              className="px-4! py-2.5! text-sm"
            >
              <Copy className="size-4" />
              Copy verification link
            </WhiteButton>
          )}

          {showLinkedIn && (
            <WhiteButton
              onClick={() => {
                window.open(
                  buildLinkedInUrl(selectedDoc, group.title),
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="px-4! py-2.5! text-sm"
            >
              <Linkedin className="size-4" />
              Add to LinkedIn
            </WhiteButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailPage;
