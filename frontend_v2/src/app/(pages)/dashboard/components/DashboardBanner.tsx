import Card from "./dashboard/ui/Card";
import Image from "next/image";

const DashboardBanner = () => {
  const user = {
    name: "John Doe",
    enrolledCourses: [
      {
        certificateIssued: true,
      },
    ],
  };
  const hour = new Date().getHours();
  const timeMessage =
    hour >= 18
      ? "Good Evening"
      : hour >= 12
      ? "Good Afternoon"
      : "Good Morning";
  const certificateCount =
    user.enrolledCourses?.filter((course) => course.certificateIssued)
      ?.length || 0;

  return (
    <div className="flex w-full py-6 px-4 sm:px-8 lg:px-20 flex-col lg:flex-row gap-4 lg:gap-0 shadow-[0_2px_0_rgba(0,0,0,0.1)]">
      <div className="w-max flex flex-col gap-1 text-text-primary whitespace-nowrap">
        <h2 className="text-xl sm:text-2xl font-bold">
          {timeMessage},{" "}
          {user?.name
            ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
            : ""}
        </h2>
        <p className="text-sm font-semibold">Welcome to Airkrit!</p>
      </div>
      <div className="ml-auto w-max flex items-center gap-2 sm:gap-4 lg:gap-6 flex-wrap">
        <Card
          title="Courses"
          count={user?.enrolledCourses?.length || 0}
          icon={
            <Image
              src="/dashboard/CourseBannerIcon.svg"
              width={24}
              height={24}
              alt="courses"
              draggable={false}
            />
          }
        />
        <Card
          title="Certificates"
          count={certificateCount}
          icon={
            <Image
              src="/dashboard/CertificateBannerIcon.svg"
              width={24}
              height={24}
              alt="certificates"
              draggable={false}
            />
          }
        />
        {/* <Card title="Applications" count={10} icon={<Image src="/dashboard/ApplicationsBannerIcon.svg" width={24} height={24} alt="applications" draggable={false} />} /> */}
      </div>
    </div>
  );
};

export default DashboardBanner;
