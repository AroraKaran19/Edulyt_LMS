"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import ImageComponent from "@/components/ui/ImageComponent";
import apiClient from "@/configs/apiConfig";
import { Certificate } from "@/types/certificate";
import useCertificates from "@/hooks/useCertificates";

const CertificateDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const certificateId = params?.certificateId as string;
  const { downloadCertificate } = useCertificates();

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) {
        setError("Certificate ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get(`/certificates/${certificateId}`);
        setCertificate(response.data.data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.error?.message ||
          err.message ||
          "Certificate not found";
        setError(errorMsg);
        console.error("Certificate fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const handleDownload = async () => {
    if (!certificate?.fileUrl) {
      setError("Certificate file not available");
      return;
    }

    setIsDownloading(true);
    try {
      await downloadCertificate(certificate);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVerify = () => {
    if (certificate?.verificationCode) {
      router.push(`/verify-certificate/${certificate.verificationCode}`);
    } else if (certificate?.verificationUrl) {
      // Extract verification code from URL or use the full URL
      const urlParts = certificate.verificationUrl.split("/");
      const code = urlParts[urlParts.length - 1];
      router.push(`/verify-certificate/${code}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Certificate Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The certificate you are looking for does not exist."}
          </p>
          <button
            onClick={() => router.push("/dashboard/certificates")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Course Information */}
          <div className="space-y-2">
            {/* Completion Status */}
            <div className="flex items-center gap-3 bg-linear-to-r from-green-200 to-white rounded-xl p-1">
              <CheckCircle className="w-6 h-6 text-[#12B669]" />
              <span className="text-lg font-semibold text-[#12B669] font-plus-jakarta ">
                Completed on{" "}
                {new Date(certificate.completionDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  }
                )}
              </span>
            </div>

            {/* Course Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {(typeof certificate.courseId === "object" &&
                  certificate.courseId?.title) ||
                  certificate.courseName}
              </h1>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-xl p-3 border border-[#0000001F]">
              <p className="text-[#2B1508] font-bold font-plus-jakarta text-sm mb-2">
                Certificate Details
              </p>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs">
                    Certificate ID
                  </span>
                  <span className="text-[#000000] font-semibold font-plus-jakarta text-sm font-mono">
                    {certificate.certificateId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs">
                    Student Name
                  </span>
                  <span className="text-[#000000] font-semibold font-plus-jakarta text-sm">
                    {certificate.studentName}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs">
                    Issued Date
                  </span>
                  <span className="text-[#000000] font-semibold font-plus-jakarta text-sm">
                    {new Date(certificate.issuedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      }
                    )}
                  </span>
                </div>
                {certificate.verificationCode && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[#00000080] font-semibold font-plus-jakarta text-xs">
                      Verification Code
                    </span>
                    <span className="text-[#000000] font-semibold font-plus-jakarta text-sm font-mono break-all">
                      {certificate.verificationCode}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard/certificates")}
                className="mt-4 flex justify-center items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
              >
                <span className="">Back to Certificates</span>
              </button>
            </div>

            {/* Key Topics */}
            {certificate.keyTopics && (
              <div className="bg-white rounded-xl p-6 border border-[#0000001F] mt-4">
                <h3 className="text-[#2B1508] font-bold font-plus-jakarta text-sm mb-2">
                  Key Topics Covered
                </h3>
                <p className="text-[#000000] font-normal font-plus-jakarta text-sm leading-relaxed">
                  {certificate.keyTopics}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Certificate */}
          <div className="space-y-6">
            {/* Certificate Preview */}
            {typeof certificate.courseId === "object" &&
              certificate.courseId?.thumbnail && (
                <div className="bg-white rounded-xl p-6 border border-[#0000001F]">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Program
                  </h2>
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

            {/* Certificate Image */}
            <div className="bg-[#F8F8F8] rounded-md p-6 border border-[#00000017] min-h-[460px]">
              <div className="relative w-full h-full bg-white overflow-hidden">
                {certificate.fileUrl ? (
                  <iframe
                    src={certificate.fileUrl}
                    className="w-full h-full min-h-[420px]"
                    title="Certificate PDF"
                  />
                ) : (
                  <Image
                    src="/certificate-complete-image.png"
                    alt="certificate"
                    width={585}
                    height={420}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {certificate.verificationCode && (
                <button
                  type="button"
                  onClick={handleVerify}
                  className="flex-1 flex justify-center items-center gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-3 py-[10px] text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                >
                  <ExternalLink size={20} />
                  Verify Certificate
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!certificate.fileUrl || isDownloading}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-[10px] rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    Download certificate
                    <Download size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailPage;
