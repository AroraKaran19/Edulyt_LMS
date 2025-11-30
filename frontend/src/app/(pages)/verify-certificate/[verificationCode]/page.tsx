"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import ImageComponent from "@/components/ui/ImageComponent";
import { CertificateVerificationData } from "@/types/certificate";

const VerifyCertificatePage = () => {
  const params = useParams();
  const verificationCode = params?.verificationCode as string;

  const [certificate, setCertificate] =
    useState<CertificateVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!certificate?.fileUrl) {
      setError("Certificate file not available");
      return;
    }

    try {
      setIsDownloading(true);
      // Fetch the file as a blob to ensure proper download with filename
      const response = await fetch(certificate.fileUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch certificate file");
      }

      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link with proper filename
      const link = document.createElement("a");
      link.href = blobUrl;

      // Sanitize filename: remove special characters, replace spaces with underscores
      const sanitizeFilename = (str: string): string => {
        return str
          .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/_+/g, "_") // Replace multiple underscores with single
          .replace(/^_|_$/g, "") // Remove leading/trailing underscores
          .substring(0, 100); // Limit length
      };

      const sanitizedCourseName = sanitizeFilename(
        certificate.courseName || ""
      );
      const sanitizedStudentName = sanitizeFilename(
        certificate.studentName || ""
      );
      link.download = `Airkrit_${sanitizedCourseName}_${sanitizedStudentName}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError("Failed to download certificate");
      console.error("Certificate download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying certificate...</p>
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
            Certificate Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The certificate you are looking for does not exist or has been invalidated."}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header with Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Certificate Verified
                </h1>
                <p className="text-gray-600 text-sm">
                  This certificate is authentic and has been verified
                </p>
              </div>
            </div>

            {/* Action Buttons - Prominently placed */}
            {certificate.fileUrl && (
              <div className="flex flex-col sm:flex-row gap-3 md:ml-4">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-bold text-base transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Certificate
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Certificate Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Student Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.studentName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Course Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.courseId?.title || certificate.courseName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
              <p className="text-lg font-semibold text-gray-900 font-mono">
                {certificate.certificateId}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Issued Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

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
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        {certificate.courseId?.thumbnail && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course</h2>
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

        {/* Secondary Download Button at Bottom (for mobile/scroll) */}
        {certificate.fileUrl && (
          <div className="bg-white rounded-xl shadow-lg p-6 sticky bottom-4 z-10">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Certificate
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
