import { CourseReducerProvider } from "../../reducers/course/providers/CourseReducerProvider";
import { ScreenProvider } from "./contexts/ScreenContext";

export default function CreateCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CourseReducerProvider>
      <ScreenProvider>
        {children}
      </ScreenProvider>
    </CourseReducerProvider>
  );
}
