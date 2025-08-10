import FlexBox from "@/components/ui/FlexBox";
import React from "react";
import Card from "./dashboard/ui/Card";
import Image from "next/image";

const DashboardBanner = () => {
  const user = {
    name: "John Doe",
    image: "https://via.placeholder.com/150",
  }
  const hour = new Date().getHours();
  const timeMessage = hour >= 18 ? "Good Evening" : hour >= 12 ? "Good Afternoon" : "Good Morning";
  
	return (
    <FlexBox className="w-full items-stretch py-4 px-20">
      <FlexBox className="w-1/2 flex-col gap-1 text-text-primary">
        <h2 className="text-2xl font-bold">
          {timeMessage}, {user.name}
        </h2>
        <p className="text-sm font-semibold">Welcome to Edulyt!</p>
      </FlexBox>
      <FlexBox className="w-1/2 items-center justify-end gap-6">
        <Card title="Courses" count={10} icon={<Image src="/CourseBannerIcon.svg" width={24} height={24} alt="courses" draggable={false} />} />
        <Card title="Certificates" count={10} icon={<Image src="/CertificateBannerIcon.svg" width={24} height={24} alt="certificates" draggable={false} />} />
        <Card title="Applications" count={10} icon={<Image src="/ApplicationsBannerIcon.svg" width={24} height={24} alt="applications" draggable={false} />} />
      </FlexBox>
    </FlexBox>
  );
};

export default DashboardBanner;
