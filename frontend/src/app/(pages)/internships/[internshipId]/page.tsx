import React from "react";

const IndividualInternshipPage = ({
  params,
}: {
  params: { internshipId: string };
}) => {
  const internshipId = params.internshipId;

  return (
    <div>
      <h1>Individual Internship Page</h1>
      <p>Internship ID: {internshipId}</p>
    </div>
  );
};

export default IndividualInternshipPage;
