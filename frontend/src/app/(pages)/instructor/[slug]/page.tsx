import MentorPage from "./components/MentorPage";

const InstructorIndividualPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return <MentorPage slug={slug} />;
};

export default InstructorIndividualPage;
