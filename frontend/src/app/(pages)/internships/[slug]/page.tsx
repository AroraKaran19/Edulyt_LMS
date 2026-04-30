import { Internship } from "@/types";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import { AxiosError } from "axios";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import InternshipPage from "./InternshipPage";

// Fetch internship data
async function fetchInternship(
  slug: string
): Promise<{ status: number; internship: Internship | null }> {
  try {
    const response = await fetcher(`${ENDPOINTS.internships.bySlug}/${slug}`);
    return {
      status: response?.status || 500,
      internship: response?.data?.data || null,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 500,
        internship: null,
      };
    }
    return { status: 500, internship: null };
  }
}

// Generate metadata for the course page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { internship } = await fetchInternship(slug);

  if (!internship) {
    return {
      title: "Not Found | Airkrit",
      description: "The requested course could not be found.",
    };
  }

  return {
    title: internship.metaTitle || `${internship.title} | Airkrit`,
    description:
      internship.metaDescription ||
      `Learn ${internship.title} with Airkrit's comprehensive course.`,
    keywords: [
      "internship",
      "airkrit",
      "learn",
      "education",
      ...(internship.keywords || []),
    ],
    openGraph: {
      title: internship.metaTitle || `${internship.title} | Airkrit`,
      description:
        internship.metaDescription || `Learn ${internship.title} with Airkrit.`,
      url: `https://airkrit.com/internships/${slug}`,
      type: "website",
      siteName: "Airkrit",
      images: [
        {
          url:
            internship.thumbnail ||
            `https://airkrit.com/internships/${slug}/thumbnail.png`,
          alt: `${internship.title} internship image`,
        },
      ],
    },
  };
}

const IndividualCoursePage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const { status, internship } = await fetchInternship(slug);

  const errorConfig = getErrorUIConfig({
    statusCode: status,
    errorType: "backend",
  });
  if (status === 404 || !internship) {
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title="Internship Not Found"
        description="The internship you're looking for doesn't exist or has been removed."
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

  return <InternshipPage internship={internship} />;
};

export default IndividualCoursePage;
