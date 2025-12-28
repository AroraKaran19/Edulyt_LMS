import Image from "next/image";
import { technologyRequirements } from "@/constants/internshipData";

const PrerequisitesSection = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-20 mt-12 sm:mt-16 lg:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Left Section - Text Content */}
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            <span className="text-[#F77124] font-extrabold">Pre-Requisites:</span>{" "}
            <div className="text-gray-900 font-extrabold mt-1 sm:mt-2">Technology Requirements</div>
          </h2>
          <p className="text-black text-sm sm:text-base mb-4 sm:mb-6 max-w-xl">
            To Ensure A Smooth Learning Experience During The Internship,
            Students Are Expected To Have The Following Basic Technology Setup.
          </p>

          <ul className="space-y-3 sm:space-y-4">
            {technologyRequirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#F77124] border rounded-full mt-1 sm:mt-2 shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base lg:text-lg font-medium">
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Section - Image */}
        <div className="h-full w-full flex items-center justify-center lg:justify-end order-1 lg:order-2">
          <div className="relative w-full max-w-md lg:max-w-none">
            <Image
              src="/assets/PreRequisiteImage.png"
              alt="Technology requirements"
              width={500}
              height={500}
              className="object-cover rounded-xl sm:rounded-2xl w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrerequisitesSection;
