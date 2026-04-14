import { Internship } from "@/types";
import FeatureCarousel from "./FeatureCarousel";

const InternshipFeatureSection = ({
  features,
}: {
  features: Internship["features"];
}) => {
  if (!features?.length) return null;

  return (
    <section
      id="features"
      className="w-full bg-linear-to-b from-primary/2 via-primary/4 to-secondary/15"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14 2xl:max-w-[1600px]">
        <h2 className="text-center text-4xl font-bold">
          <span className="text-primary">Internship</span> Features
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-base text-text-primary">
          Discover how this internship helps you grow through hands-on learning
          and industry exposure.
        </p>
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 2xl:max-w-[1600px] relative pb-14">
        <FeatureCarousel features={features} />
      </div>
    </section>
  );
};

export default InternshipFeatureSection;
