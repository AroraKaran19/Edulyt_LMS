import type { Metadata } from "next";
import ExamPage from "./ExamPage";

type Props = {
  params: Promise<{ enrollmentId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { enrollmentId } = await params;
  return {
    title: "Entrance Exam | Airkrit",
    description: "Take your internship entrance exam",
    robots: { index: false, follow: false },
    openGraph: {
      title: "Entrance Exam | Airkrit",
      description: "Take your internship entrance exam",
      url: `https://www.airkrit.com/dashboard/internships/exam/${enrollmentId}`,
    },
  };
}

export default function InternshipExamPage() {
  return <ExamPage />;
}
