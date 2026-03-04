import Link from "next/link";
import { BookOpen, Briefcase, Award } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-[calc(100vh-78px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#FFF8F5] via-white to-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Welcome to{" "}
              <span className="text-[#F77124]">Airkrit India</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Master in-demand skills through expert-led courses and hands-on
              internships. Learn at your pace and advance your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <Link
                href="/courses"
                className="w-full sm:w-auto bg-[#F77124] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#E6651A] transition-colors text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-12">
            Why <span className="text-[#F77124]">Airkrit</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50/80 hover:bg-orange-50/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#F77124]/10 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-[#F77124]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Expert-Led Courses
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Learn from industry professionals with structured, practical
                content designed for real-world success.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50/80 hover:bg-orange-50/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#F77124]/10 flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-[#F77124]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Real Internships
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Gain hands-on experience with internship programs that bridge
                the gap between learning and career.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50/80 hover:bg-orange-50/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#F77124]/10 flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-[#F77124]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Recognized Certificates
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Earn certificates upon completion to showcase your skills and
                boost your professional profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-linear-to-r from-[#F77124] to-[#E6651A]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Join thousands of learners advancing their careers. Start your
            journey today.
          </p>
          <Link
            href="/courses"
            className="inline-flex bg-white text-[#F77124] px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Explore Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
