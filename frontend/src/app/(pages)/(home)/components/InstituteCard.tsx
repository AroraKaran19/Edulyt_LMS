import InstructorCard from "@/components/ui/course/InstructorCard";
import Image from "next/image";
import type {
  HomeInstituteSpotlight,
  HomePageInstitute,
} from "@/types/home-page-settings";

const DEFAULT_SPOTLIGHT: HomeInstituteSpotlight = {
  first_name: "John",
  last_name: "Doe",
  avatar: "",
};

function SpotlightRow({ people }: { people: HomeInstituteSpotlight[] }) {
  const meaningful = people.filter(
    (p) =>
      p.first_name?.trim() ||
      p.last_name?.trim() ||
      p.avatar?.trim()
  );
  const display = meaningful.length ? meaningful : [DEFAULT_SPOTLIGHT];
  const shown = display.slice(0, 2);
  const extra = Math.max(0, display.length - 2);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((p, i) => (
        <InstructorCard
          key={i}
          disableLink
          instructor={{
            firstName: p.first_name?.trim() || "John",
            lastName: p.last_name?.trim() || "Doe",
            profilePicture: p.avatar?.trim() || undefined,
          }}
        />
      ))}
      {extra > 0 && (
        <span className="text-xs font-bold text-text-secondary tabular-nums">
          +{extra}
        </span>
      )}
    </div>
  );
}

const InstituteCard = ({
  institute,
}: {
  institute: HomePageInstitute;
}) => {
  const internshipPeople = institute.internship_spotlights ?? [];
  const coursePeople = institute.course_spotlights ?? [];

  return (
    <div className="w-full bg-white rounded-2xl p-5 shadow-[0_0_10px_0_rgba(0,0,0,0.1)] flex flex-col gap-5">
      <Image
        src={institute.image}
        alt={institute.name}
        width={400}
        height={400}
        className="w-full h-auto max-h-[200px] object-cover rounded-2xl select-none"
        draggable={false}
        loading="lazy"
        quality={100}
      />
      <p className="text-xl lg:text-2xl font-extrabold">{institute.name}</p>

      <div className="content flex flex-col gap-5">
        <div className="internship-count flex flex-col gap-2">
          <p className="text-base font-semibold text-text-secondary">
            {institute.line1}
          </p>
          <p className="text-sm font-normal text-text-secondary">
            <span className="text-primary font-semibold">
              {institute.internship_student_count}+ students
            </span>{" "}
            joined our{" "}
            <span className="font-semibold">Internship Programs</span>
          </p>
          <SpotlightRow people={internshipPeople} />
        </div>

        <div className="course-count flex flex-col gap-2">
          <p className="text-base font-semibold text-text-secondary">
            {institute.line2}
          </p>
          <p className="text-sm font-normal text-text-secondary">
            <span className="text-primary font-semibold">
              {institute.course_student_count}+ students
            </span>{" "}
            enrolled in our <span className="font-semibold">Courses</span>
          </p>
          <SpotlightRow people={coursePeople} />
        </div>
      </div>
    </div>
  );
};

export default InstituteCard;
