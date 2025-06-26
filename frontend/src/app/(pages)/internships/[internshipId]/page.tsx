import React from "react";

const IndividualInternshipPage = async ({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) => {
  const { internshipId } = await params;

  return (
    <div>
      <h1>Individual Internship Page</h1>
      <p>Internship ID: {internshipId}</p>
    </div>
  );
};

export default IndividualInternshipPage;
