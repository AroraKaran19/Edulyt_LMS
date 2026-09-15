import { Internship } from "@/types";
import { Icon } from "@iconify/react";
import Image from "next/image";

const PreRequisitesSection = ({
  preRequisites,
  whoCanJoin,
  image,
}: {
  preRequisites: Internship["preRequisites"];
  whoCanJoin: Internship["whoCanJoin"];
  image?: string;
}) => {
  const keyBenefits: string[] = [
    "Mentor-Led Live Sessions",
    "Real Industry projects",
    "Flexible Schedule",
  ];

  return (
    <section
      id="pre-requisites"
      className="w-full bg-linear-to-t from-primary/2 via-primary/4 to-secondary/15"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14 2xl:max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="col-span-3 flex flex-col gap-4">
            <div className="heading flex flex-col gap-2">
              <h2 className="text-4xl font-extrabold text-primary">
                Pre-Requisites:
              </h2>
              <h2 className="text-4xl font-extrabold text-black">
                Technology Requirements
              </h2>
              <p className="text-base text-text-primary mt-2">
                To ensure a smooth learning experience during the internship,
                students are expected to have the following basic technology
                setup.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-xl mt-4">
              {preRequisites.map((item, index) => (
                <div key={index} className="flex gap-2 col-span-1">
                  <div className="icon-container flex size-7.5 p-1 shrink-0 items-center justify-center rounded-full bg-primary/80">
                    <Icon
                      icon={item.icon}
                      className="size-full text-secondary"
                    />
                  </div>
                  <span className="text-base text-text-primary">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-extrabold mt-4">
              <span className="text-primary">Who</span> Can Join?
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-4">
              {whoCanJoin.map((item, index) => (
                <div key={index} className="flex gap-2 col-span-1">
                  <div className="icon-container flex size-7.5 p-1 shrink-0 items-center justify-center rounded-full bg-primary/80">
                    <Icon
                      icon={item.icon}
                      className="size-full text-secondary"
                    />
                  </div>
                  <span className="text-base text-text-primary">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-auto key-benefits p-4 border border-primary/20 rounded-lg shadow-[0_0_10px_0_rgba(233,117,0,0.3)] flex flex-col gap-4">
              <h2 className="text-lg font-bold text-text-primary">
                <span className="text-primary">Key</span> Benefits:
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {keyBenefits.map((item, index) => (
                  <div key={index} className="flex gap-1 col-span-1">
                    <Icon
                      icon="lets-icons:check-fill"
                      width="24"
                      height="24"
                      className="text-primary"
                    />
                    <span className="text-base font-medium text-text-primary">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <Image
              src={image || "/internship/pre_requisites.jpg"}
              alt="Pre-Requisites Image"
              width={500}
              height={500}
              className="w-full max-h-[600px] object-cover rounded-2xl select-none pointer-events-none"
              draggable={false}
              loading="lazy"
              unoptimized
              quality={100}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreRequisitesSection;
