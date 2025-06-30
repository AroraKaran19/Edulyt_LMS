import React from "react";

const IndividualCoursePage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = await params;

  return (
    <div>
      <h1>Individual Course Page</h1>
      <p>Course ID: {courseId}</p>
    </div>
  );
};

export default IndividualCoursePage;
