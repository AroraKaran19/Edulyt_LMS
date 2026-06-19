"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
                  timeZone: "Asia/Kolkata",
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

      </div>
    </div>
  );
};

export default VerifyCertificatePage;
