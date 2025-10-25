import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Course, CourseModule } from "@/types";

const CurriculumSection = ({ course }: { course: Course }) => {
  const totalLessons = (course.modules as CourseModule[])?.reduce(
    (acc, module) => acc + (module?.lessons?.length ?? 0),
    0
  );

  const courseLanguage = (language: string) => {
    if (language === "en") return "English";
    if (language === "hi") return "Hindi";
    if (language === "es") return "Spanish";
    if (language === "fr") return "French";
    if (language === "de") return "German";
    if (language === "pt") return "Portuguese";
    if (language === "it") return "Italian";
    if (language === "ru") return "Russian";
    if (language === "zh") return "Chinese";
    if (language === "ja") return "Japanese";
    if (language === "ko") return "Korean";
    if (language === "ar") return "Arabic";
    return language;
  };

  const courseInformation = [
    {
      title: "Learning content",
      value: `${totalLessons} ${totalLessons === 1 ? "Lesson" : "Lessons"}`,
    },
    {
      title: "Languages and tools",
      value: courseLanguage(course.language),
    },
    {
      title: "Capstone project",
      value: "Yes",
    },
  ];

  return (
    <SectionContainer id="curriculum">
      <CourseTitle title="Curriculum" className="text-4xl text-text-primary" />
      <div className="course-information-container w-full flex gap-4 flex-col md:flex-row">
        {courseInformation.map((info) => (
          <div
            key={info.title}
            className="flex flex-col gap-2 w-full md:w-[calc((100%/3)-8px)] border-2 border-gray-100 rounded-lg p-4 items-center justify-center"
          >
            <p className="text-lg md:text-3xl font-extrabold text-center">
              {info.value}
            </p>
            <p className="text-sm md:text-base text-center">{info.title}</p>
          </div>
        ))}
      </div>
      <div
        className="text-sm md:text-base text-center prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: course.description || "" }}
      />
      {course.curriculum && course.curriculum !== "" && (
        <OrangeButton
          glow={false}
          className="w-fit self-center font-bold"
          onClick={async () => {
            try {
              const response = await fetch(course.curriculum!);

              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `${course.title}-curriculum.pdf`;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.URL.revokeObjectURL(url);
              } else {
                window.open(course.curriculum!, "_blank");
              }
            } catch (error) {
              console.error("Download failed:", error);
              // Fallback: open in new tab
              window.open(course.curriculum!, "_blank");
            }
          }}
        >
          Download Curriculum
        </OrangeButton>
      )}
    </SectionContainer>
  );
};

export default CurriculumSection;
