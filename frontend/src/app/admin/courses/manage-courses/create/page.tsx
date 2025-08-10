"use client";
import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import { BookOpenIcon } from "lucide-react";
import React from "react";
import Screen1 from "./components/Screen1";
import Screen2 from "./components/Screen2";
import Screen3 from "./components/Screen3";
import Screen4 from "./components/Screen4";
import Screen5 from "./components/Screen5";
import Screen6 from "./components/Screen6";
import Screen7 from "./components/Screen7";
import Screen8 from "./components/Screen8";
import { ScreenProvider, useScreen } from "./contexts/ScreenContext";
import { CourseReducerProvider } from "../../reducers";

const CreateCourseContent = () => {
  const { activeScreen } = useScreen();

  return (
    <FlexBox className="w-full h-full flex-col gap-8 px-8 relative">
      <Container
        title="Create Course"
        icon={BookOpenIcon}
        className="rounded-t-none flex-shrink-0"
      />
      <FlexBox className="w-full flex-1 min-h-0 flex-col">
        {activeScreen === "screen1" && <Screen1 />}
        {activeScreen === "screen2" && <Screen2 />}
        {activeScreen === "screen3" && <Screen3 />}
        {activeScreen === "screen4" && <Screen4 />}
        {activeScreen === "screen5" && <Screen5 />}
        {activeScreen === "screen6" && <Screen6 />}
        {activeScreen === "screen7" && <Screen7 />}
        {activeScreen === "screen8" && <Screen8 />}
      </FlexBox>
    </FlexBox>
  );
};

const CreateCoursePage = () => {
  return (
    <CourseReducerProvider>
      <ScreenProvider>
        <CreateCourseContent />
      </ScreenProvider>
    </CourseReducerProvider>
  );
};

export default CreateCoursePage;
