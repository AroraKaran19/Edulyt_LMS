import FlexBox from "@/components/ui/FlexBox";
import React from "react";
import Card from "./dashboard/ui/Card";
import Image from "next/image";
import { useSession } from "next-auth/react";

const DashboardBanner = () => {
  const user = useSession().data?.user;
  const hour = new Date().getHours();
  const timeMessage =
    hour >= 18
      ? "Good Evening"
      : hour >= 12
      ? "Good Afternoon"
      : "Good Morning";
  const certificateCount = user?.enrolledCourses?.filter(
    (course) => course.certificateIssued
  )?.length || 0;

  return (
    <FlexBox className="w-full items-stretch py-4 px-4 sm:px-8 lg:px-20 flex-col lg:flex-row gap-4 lg:gap-0">
      <FlexBox className="w-full flex-col gap-1 text-text-primary">
        <h2 className="text-xl sm:text-2xl font-bold">
          {timeMessage},{" "}
          {user?.name
            ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
            : ""}
        </h2>
        <p className="text-sm font-semibold">Welcome to Airkrit!</p>
      </FlexBox>
      <FlexBox className="w-full items-center justify-center lg:justify-start gap-2 sm:gap-4 lg:gap-6 flex-wrap">
        <Card
          title="Courses"
          count={user?.enrolledCourses?.length || 0}
          icon={
            <Image
              src="/CourseBannerIcon.svg"
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
              src="/CertificateBannerIcon.svg"
              width={24}
              height={24}
              alt="certificates"
              draggable={false}
            />
          }
        />
        {/* <Card title="Applications" count={10} icon={<Image src="/ApplicationsBannerIcon.svg" width={24} height={24} alt="applications" draggable={false} />} /> */}
      </FlexBox>
    </FlexBox>
  );
};

export default DashboardBanner;
