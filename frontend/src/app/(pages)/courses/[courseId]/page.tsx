import React from "react";
import Head from "next/head";
import CoursePage from "./CoursePage";

const IndividualCoursePage = async ({ params }: { params: Promise<{ courseId: string }> }) => {
  const courseId = (await params).courseId;
  console.log(JSON.parse(`{"id": "${courseId}"}`));

  return <CoursePage courseId={courseId} />;
};

export default IndividualCoursePage;
