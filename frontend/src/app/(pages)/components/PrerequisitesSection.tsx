import Image from "next/image";
import { technologyRequirements } from "@/constants/internshipData";

const PrerequisitesSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-20 mt-16 lg:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Section - Text Content */}
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="text-[#F77124] font-extrabold">Pre-Requisites:</span>{" "}
            <div className="text-gray-900 font-extrabold">Technology Requirements</div>
          </h2>
          <p className="text-black text-base mb-6 max-w-xl">
            To Ensure A Smooth Learning Experience During The Internship,
            Students Are Expected To Have The Following Basic Technology Setup.
          </p>

          <ul className="space-y-4">
            {technologyRequirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#F77124] border rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700 text-base lg:text-lg font-medium">
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Section - Image */}
          <div className="h-full w-full bg-red400 flex items-center justify-end">
            <Image
              src="/assets/PreRequisiteImage.png"
              alt="Technology requirements"
              width={500}
              height={500}
              className="object-cover rounded-2xl"
              priority
            />
          </div>
      </div>
    </div>
  );
};

export default PrerequisitesSection;
