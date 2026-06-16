import { Instructor } from "@/types";
import React from "react";
import { cn } from "@/lib/utils";
import ImageComponent from "@/components/ui/ImageComponent";
import Link from "next/link";

const LinkedinIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      className={cn("w-4 h-4", className)}
    >
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
    </svg>
  );
};

const InstructorCard = ({
  instructor,
  ...props
}: { instructor: Instructor } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const getInitials = () => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName[0]}${instructor.lastName[0]}`.toUpperCase();
    } else if (instructor.firstName) {
      return instructor.firstName[0].toUpperCase();
    } else if (instructor.lastName) {
      return instructor.lastName[0].toUpperCase();
    } else if (instructor.email) {
      return instructor.email[0].toUpperCase();
    }
    return "I";
  };

  const getDisplayName = () => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    } else if (instructor.firstName) {
      return instructor.firstName;
    } else if (instructor.lastName) {
      return instructor.lastName;
    } else if (instructor.email) {
      return instructor.email;
    }
    return "Instructor";
  };

  const getSlug = () => {
    return `${instructor.firstName}${
      instructor.lastName ? "-" + instructor.lastName : ""
    }`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  return (
    <div
      className={cn(
        "instructor-card w-full max-w-[450px] mx-auto h-full bg-white rounded-2xl flex flex-col gap-5 py-7.5 px-5 border border-primary shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] cursor-pointer",
        props.className,
      )}
      title={`Click to view ${getDisplayName()}'s profile`}
      onClick={() => window.open(`/mentor/${getSlug()}`, "_blank", "noopener")}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          window.open(`/mentor/${getSlug()}`, "_blank", "noopener");
        }
      }}
    >
      <div className="profile-picture w-28 mx-auto aspect-square rounded-full overflow-hidden">
        {instructor.profilePicture ? (
          <ImageComponent
            src={instructor.profilePicture}
            alt={getDisplayName()}
            width={100}
            height={100}
            className="w-full h-full object-cover"
            draggable={false}
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full select-none rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-semibold">
            {getInitials()}
          </div>
        )}
      </div>
      <div className="content flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-black text-center">
            {getDisplayName()}
          </span>
          {instructor.linkedinUrl && (
            <Link
              href={instructor.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${getDisplayName()}'s LinkedIn Profile`}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkedinIcon className="w-4 h-4 text-blue-600" />
            </Link>
          )}
        </div>
        {instructor.industry ? (
          <p className="text-lg font-medium text-black text-center">
            {instructor.industry}
          </p>
        ) : null}
        {(instructor.currentPosition || instructor.currentCompany) && (
          <div className="company-info flex flex-col items-center gap-0.5 w-full">
            {instructor.currentPosition ? (
              <p className="text-sm font-medium text-primary text-center leading-tight">
                {instructor.currentPosition}
              </p>
            ) : null}
            {instructor.currentCompany ? (
              <p className="text-sm text-text-primary text-center leading-tight">
                <span className="font-normal">at </span>
                <span className="font-bold">{instructor.currentCompany}</span>
              </p>
            ) : null}
          </div>
        )}

        {instructor.companyImages && instructor.companyImages.length > 0 ? (
          <div
            className="company-images mt-5 flex flex-row flex-wrap justify-center items-center gap-6 sm:gap-8 w-full px-1 pt-1"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {instructor.companyImages.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className="flex items-center justify-center shrink-0"
              >
                <ImageComponent
                  src={image}
                  alt={`${getDisplayName()} — company logo`}
                  width={120}
                  height={36}
                  draggable={false}
                  className="size-11.25 w-auto max-w-[100px] object-contain object-center"
                  unoptimized
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : null}

        {instructor.bio ? (
          <p className="text-sm mt-5 text-center text-text-secondary leading-relaxed line-clamp-3 max-w-full px-0.5">
            {instructor.bio}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default InstructorCard;
