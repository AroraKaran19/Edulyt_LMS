import { Internship } from "@/types";
import { Icon } from "@iconify/react";

const WhyJoinSection = ({ whyJoin }: { whyJoin: Internship["whyJoin"] }) => {
  return (
    <section id="why-join" className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-18 2xl:max-w-[1600px]">
        <h2 className="text-center text-4xl font-bold">
          Why Join This <span className="text-primary">Internship?</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-base text-text-primary">
          Gain hands-on experience, real project exposure, and learn directly
          from industry mentors- all in one structured , beginner-friendly
          internship program.
        </p>
        <div className="w-full mt-10 flex flex-wrap gap-8 justify-center">
          {whyJoin.map((item, index) => (
            <div
              key={index}
              className="w-full lg:w-[calc((100%-64px)/3)] shrink-0 min-w-0 flex flex-col gap-2 items-center justify-center"
            >
              <div className="icon-container flex size-19 p-4 shrink-0 items-center justify-center rounded-full bg-primary">
                <Icon icon={item.icon} className="size-full text-secondary" />
              </div>
              <h3 className="text-2xl mt-4 font-bold text-center text-text-primary">{item.title}</h3>
							<p className="text-sm text-black/60 text-center">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyJoinSection;
