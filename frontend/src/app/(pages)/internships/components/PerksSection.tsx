import Image from "next/image";
import { internshipPerks } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

const PerksSection = () => {
  const renderIcon = (perk: (typeof internshipPerks)[number]) => {
    if (perk.iconImage) {
      return (
        <Image
          src={perk.iconImage}
          alt={perk.title}
          width={48}
          height={48}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain brightness-0 invert"
        />
      );
    }
    const IconComponent = perk.icon;
    return (
      <IconComponent
        className={cn(
          "w-5 h-5 sm:w-6 sm:h-6",
          perk.highlighted ? "text-white" : "text-white"
        )}
      />
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-40 mt-12 sm:mt-16 lg:mt-24">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          <span className="text-gray-800 font-extrabold">Perks of</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internship</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
          To ensure a smooth learning experience during the internship, students
          are expected to have the following basic technology setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
        {internshipPerks.map((perk, index) => {
          const IconComponent = perk.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-lg sm:rounded-xl p-4 sm:p-6 border hover:shadow-lg transition-shadow",
                perk.highlighted
                  ? "bg-[#F77124] border-[#F77124]"
                  : "bg-[#F5691D05] border-gray-200"
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={cn(
                    "p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center",
                    perk.highlighted
                      ? "bg-white/20"
                      : "bg-[#F77124]"
                  )}
                >
                  {renderIcon(perk)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "text-lg sm:text-xl font-bold mb-1 sm:mb-2",
                      perk.highlighted ? "text-white" : "text-gray-800"
                    )}
                  >
                    {perk.title}
                  </h3>
                  <p
                    className={cn(
                      "text-xs sm:text-sm",
                      perk.highlighted ? "text-white" : "text-gray-600"
                    )}
                  >
                    {perk.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerksSection;
