import { Internship } from "@/types";
import { Icon } from "@iconify/react";

const PerksSection = ({ perks }: { perks: Internship["perks"] }) => {
  return (
    <section id="perks" className="w-full bg-white">
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto py-10 lg:py-18 px-6">
        <h2 className="text-4xl font-bold text-center">
          Perks of <span className="text-primary">Internship</span>
        </h2>
        <p className="text-center text-base text-text-primary max-w-2xl mx-auto mt-2">
          To ensure a smooth learning experience during the internship, students
          are expected to have the following basic technology setup.
        </p>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {perks.map((perk, index) => (
            <div
              key={index}
              className="w-full bg-[#F5691D05] rounded-2xl px-7 py-8 flex gap-5 shadow-[0_0_2px_rgba(0,0,0,0.3)] group hover:bg-primary transition-all duration-300 ease-in-out"
            >
              <div className="icon-container size-12 shrink-0 rounded-lg bg-primary flex items-center justify-center group-hover:bg-white transition-all duration-300 ease-in-out">
                <Icon icon={perk.icon} className="size-6 text-white group-hover:text-primary transition-all duration-300 ease-in-out" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold group-hover:text-white transition-all duration-300 ease-in-out hover:cursor-default">{perk.title}</h3>
                <p className="text-sm text-text-primary font-normal group-hover:text-white transition-all duration-300 ease-in-out hover:cursor-default">
                  {perk.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PerksSection;
