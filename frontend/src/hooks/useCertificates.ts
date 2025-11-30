import { useState, useCallback, useEffect } from "react";
import apiClient from "@/configs/apiConfig";
import { Certificate } from "@/types/certificate";

const useCertificates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const fetchCertificates = useCallback(
    async (includeOldVersions: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (includeOldVersions) {
          queryParams.append("includeOldVersions", "true");
        }

        const response = await apiClient.get(
          `/certificates?${queryParams.toString()}`
        );

        const data = response.data.data;

        // Transform dates
        const transformedCertificates = data.map((cert: any) => ({
          ...cert,
          completionDate: new Date(cert.completionDate),
          issuedAt: new Date(cert.issuedAt),
          lastDownloadedAt: cert.lastDownloadedAt
            ? new Date(cert.lastDownloadedAt)
            : undefined,
        }));

        setCertificates(transformedCertificates);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.error?.message ||
          err.message ||
          "Failed to fetch certificates";
        setError(errorMsg);
        console.error("Certificates fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const refreshCertificates = useCallback(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const downloadCertificate = useCallback(async (certificate: Certificate) => {
    if (!certificate.fileUrl) {
      setError("Certificate file not available");
      return;
    }

    try {
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

      // Optionally update download count (if you want to track this)
      // You could call an API endpoint to increment downloadCount
    } catch (err: any) {
      const errorMsg = "Failed to download certificate";
      setError(errorMsg);
      console.error("Certificate download error:", err);
    }
  }, []);

  return {
    certificates,
    isLoading,
    error,
    refreshCertificates,
    downloadCertificate,
  };
};

export default useCertificates;
