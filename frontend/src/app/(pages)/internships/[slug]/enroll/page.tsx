import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import EnrollForm from "./components/EnrollForm";
import { fetcher } from "@/lib/utils";
import { ENDPOINTS } from "@/constants/endpoints";
import { InternshipEnrollPreview } from "@/types";
import { AxiosError } from "axios";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

async function fetchEnrollPreview(slug: string): Promise<{
  status: number;
  preview: InternshipEnrollPreview | null;
}> {
  try {
    const response = await fetcher(
      `${ENDPOINTS.internships.bySlug}/${encodeURIComponent(slug)}/enroll-preview`,
    );
    const body = response?.data as
      | { data?: InternshipEnrollPreview }
      | null
      | undefined;
    return {
      status: response?.status || 500,
      preview: body?.data ?? null,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 500,
        preview: null,
      };
    }
    return { status: 500, preview: null };
  }
}

const EnrollPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const { status, preview } = await fetchEnrollPreview(slug);
  const errorConfig = getErrorUIConfig({
    statusCode: status,
    errorType: "backend",
  });

  if (status === 404 || !preview) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title="Internship Not Found"
        description="The internship you want to enroll in does not exist or is no longer available."
        className="h-[calc(100dvh-100px)] w-full"
      />
    );
  }
  if (status >= 400) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title={errorConfig.title}
        description={errorConfig.description}
        className="min-h-[calc(100dvh-100px)] w-full"
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#fffbf8] py-12 px-4 md:px-8",
        plusJakartaSans.className,
      )}
    >
      <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">
        {preview.batches.length === 0 ? (
          <p className="text-center text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
            There are no open cohorts for this program right now. Batches may be
            full, inactive, or past the application date — please try again
            later.
          </p>
        ) : (
          <EnrollForm preview={preview} />
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
