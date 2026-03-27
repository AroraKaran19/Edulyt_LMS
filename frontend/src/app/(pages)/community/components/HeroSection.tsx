"use client";

const HeroSection = () => {
  return (
    <div className="w-full pt-8 pb-4">
      <h1 className="text-3xl md:text-5xl font-extrabold text-black flex items-center gap-2 flex-wrap">
        Community Stories & <span className="text-[#F77124]">Experiences</span>
      </h1>
      <p className="text-gray-600 mt-4 text-lg font-medium">
        Learn from real journeys of our students and professionals.
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-bold">
          Share your experience and earn <span className="text-[#F77124]">Success Points</span>
        </h2>
      </div>
    </div>
  );
};

export default HeroSection;
