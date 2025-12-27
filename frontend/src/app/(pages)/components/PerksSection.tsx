import { internshipPerks } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

const PerksSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-800 font-extrabold">Perks of</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internship</span>
        </h2>
        <p className="text-black text-base lg:text-lg max-w-3xl mx-auto">
          To ensure a smooth learning experience during the internship, students
          are expected to have the following basic technology setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {internshipPerks.map((perk, index) => {
          const IconComponent = perk.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-lg p-6 border hover:shadow-lg transition-shadow",
                perk.highlighted
                  ? "bg-[#F77124] border-[#F77124]"
                  : "bg-gray-100 border-gray-200"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-xl flex-shrink-0",
                    perk.highlighted
                      ? "bg-white/20"
                      : "bg-[#F77124]"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-6 h-6",
                      perk.highlighted ? "text-white" : "text-white"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-xl font-bold mb-2",
                      perk.highlighted ? "text-white" : "text-gray-800"
                    )}
                  >
                    {perk.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
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

