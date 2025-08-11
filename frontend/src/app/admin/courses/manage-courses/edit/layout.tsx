"use client";
import React from "react";
import { EditCourseReducerProvider } from "../../reducers/course/providers/EditCourseReducerProvider";
import { EditScreenProvider } from "./contexts/EditScreenContext";
import { useParams } from "next/navigation";

export default function EditCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { courseId } = useParams();

  return (
    <EditCourseReducerProvider courseId={courseId as string}>
      <EditScreenProvider>
        {children}
      </EditScreenProvider>
    </EditCourseReducerProvider>
  );
}
