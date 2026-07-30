"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import ImageComponent from "@/components/ui/ImageComponent";
import { CertificateVerificationData } from "@/types/certificate";

/**
 * Wording per document type. One verification endpoint backs course
 * certificates, internship certificates and letters of recommendation, so this
 * page must not hard-code "Certificate" / "Course Name".
 */
const DOC_COPY = {
  course: {
    title: "Certificate",
    subject: "Course Name",
    idLabel: "Certificate ID",
    verifiedNote: "This certificate is authentic and has been verified",
  },
  internship: {
    title: "Internship Certificate",
    subject: "Internship",
    idLabel: "Certificate ID",
    verifiedNote: "This certificate is authentic and has been verified",
  },
  lor: {
    title: "Letter of Recommendation",
    subject: "Program",
    idLabel: "Document ID",
    verifiedNote:
      "This letter of recommendation is authentic and has been verified",
  },
} as const;

/** Calendar day in IST as `YYYY-MM-DD`, so two dates compare as strings. */
const istDay = (value: Date | string): string | null => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

/**
 * An issue date before the completion date reads as a certificate awarded
 * before it was earned. That happens when the document was generated ahead of
 * the programme window closing, so the field is hidden rather than shown wrong.
 */
const shouldShowIssuedDate = (
  issuedAt?: Date | string,
  completionDate?: Date | string,
): boolean => {
  if (!issuedAt) return false;
  const issued = istDay(issuedAt);
  if (!issued) return false;
  const completed = completionDate ? istDay(completionDate) : null;
  if (!completed) return true;
  return issued >= completed;
};

const VerifyCertificatePage = () => {
  const params = useParams();
  const verificationCode = params?.verificationCode as string;

  const [certificate, setCertificate] =
    useState<CertificateVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!verificationCode) {
        setError("Verification code is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get(
          `/certificates/verify/${verificationCode}`
        );
        setCertificate(response.data.data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.error?.message ||
          err.message ||
          "Certificate not found or invalid";
        setError(errorMsg);
        console.error("Certificate verification error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [verificationCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying document...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Document Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The document you are looking for does not exist or has been invalidated."}
          </p>
          <p className="text-sm text-gray-500">
            Verification Code:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {verificationCode}
            </code>
          </p>
        </div>
      </div>
    );
  }

  const copy = DOC_COPY[certificate.certificateType ?? "course"] ?? DOC_COPY.course;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header with Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {copy.title} Verified
              </h1>
              <p className="text-gray-600 text-sm">{copy.verifiedNote}</p>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {copy.title} Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Student Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.studentName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">{copy.subject}</p>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.courseId?.title || certificate.courseName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">{copy.idLabel}</p>
              <p className="text-lg font-semibold text-gray-900 font-mono">
                {certificate.certificateId}
              </p>
            </div>

            {shouldShowIssuedDate(
              certificate.issuedAt,
              certificate.completionDate,
            ) && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Issued Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-1">Verification Code</p>
              <p className="text-lg font-semibold text-gray-900 font-mono break-all">
                {certificate.verificationCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Completion Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(certificate.completionDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        {certificate.courseId?.thumbnail && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Program</h2>
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <ImageComponent
                src={certificate.courseId.thumbnail}
                alt={certificate.courseId.title || certificate.courseName}
                width={800}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyCertificatePage;
