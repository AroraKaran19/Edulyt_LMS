import HomeCourseSection from "../HomeCourseSection";

const HomeInternshipPath = () => {
  return (
    <section
      id="home-internship"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="content-body flex flex-col gap-6">
          <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize text-balance">
            Our <span className="text-primary">Internships Programs</span>
          </h2>
          <HomeCourseSection audience="college-students" />
        </div>
      </div>
    </section>
  );
};

export default HomeInternshipPath;
