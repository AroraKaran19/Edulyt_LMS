import { EditCourseReducerProvider } from "../../reducers/course/providers/EditCourseReducerProvider";
import { ScreenProvider } from "./contexts/ScreenContext";

export default function EditCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EditCourseReducerProvider>
      <ScreenProvider>
        {children}
      </ScreenProvider>
    </EditCourseReducerProvider>
  );
}
