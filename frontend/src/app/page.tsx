import Link from "next/link";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl lg:text-6xl font-bold text-gray-900">
          Welcome to <span className="text-[#F77124]">Airkrit India</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore our courses and internship programs to advance your career
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/courses"
            className="bg-[#F77124] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#F77124]/90 transition-colors text-lg"
          >
            Browse Courses
          </Link>
          <Link
            href="/internship"
            className="bg-white text-[#F77124] border-2 border-[#F77124] px-8 py-3 rounded-lg font-semibold hover:bg-[#F77124] hover:text-white transition-colors text-lg"
          >
            Internship Program
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
