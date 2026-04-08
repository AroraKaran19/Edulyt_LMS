import InstructorCard from "@/components/ui/course/InstructorCard";
import Image from "next/image";

interface InstituteCardProps {
  image: string;
  name: string;
  line1: string;
  internship_student_count: number;
  line2: string;
  course_student_count: number;
}

const InstituteCard = ({ institute }: { institute: InstituteCardProps }) => {
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
          <InstructorCard
            instructor={{
              firstName: "John",
              lastName: "Doe",
            }}
          />
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
          <InstructorCard
            instructor={{
              firstName: "John",
              lastName: "Doe",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InstituteCard;
