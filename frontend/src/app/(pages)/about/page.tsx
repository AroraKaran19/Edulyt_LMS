import React from "react";
import Image from "next/image";
import {
  Users,
  Award,
  Target,
  Globe,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
  const stats = [
    {
      icon: Users,
      label: "Students Enrolled",
      value: "10,000+",
      description: "Active learners",
    },
    {
      icon: BookOpen,
      label: "Courses Available",
      value: "50+",
      description: "Industry-relevant",
    },
    {
      icon: Award,
      label: "Certificates Issued",
      value: "8,500+",
      description: "Successfully completed",
    },
    {
      icon: Globe,
      label: "Countries Reached",
      value: "25+",
      description: "Global presence",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Excellence",
      description:
        "We strive for excellence in every course, ensuring the highest quality education for our students.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "Building a supportive learning community where students can grow and succeed together.",
    },
    {
      icon: Globe,
      title: "Innovation",
      description:
        "Continuously innovating our teaching methods and technology to provide the best learning experience.",
    },
    {
      icon: Award,
      title: "Integrity",
      description:
        "Maintaining the highest standards of integrity and transparency in all our operations.",
    },
  ];

  const achievements = [
    "Recognized by leading industry partners",
    "Featured in top educational platforms",
    "Award-winning course content",
    "High student satisfaction rates",
    "Industry-aligned curriculum",
    "Expert instructors from top companies",
  ];

  const team = [
    {
      name: "Our Expert Instructors",
      role: "Industry Professionals",
      description:
        "Learn from professionals working at top companies like Google, Microsoft, Amazon, and more.",
      image: "/user.svg",
    },
    {
      name: "Our Support Team",
      role: "24/7 Assistance",
      description:
        "Dedicated support team to help you throughout your learning journey.",
      image: "/user.svg",
    },
    {
      name: "Our Content Team",
      role: "Curriculum Experts",
      description:
        "Experienced educators who design industry-relevant and up-to-date course content.",
      image: "/user.svg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-[#F77124]">Airkrit</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Empowering students and professionals with industry-relevant
              skills through comprehensive online courses and internship
              opportunities.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <stat.icon className="w-8 h-8 text-[#F77124] mx-auto mb-4" />
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Airkrit, we believe that quality education should be
                accessible to everyone. Our mission is to bridge the gap between
                traditional education and industry requirements by providing
                practical, skill-based learning experiences.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We partner with industry experts and leading companies to create
                courses that not only teach theoretical concepts but also
                provide hands-on experience with real-world projects and
                internship opportunities.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-[#F77124] text-white px-6 py-3 rounded-2xl font-semibold hover:bg-[#E65A1A] transition-colors"
              >
                Explore Our Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl p-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <GraduationCap className="w-12 h-12 text-[#F77124] mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Why Choose Airkrit?
                  </h3>
                  <ul className="space-y-3">
                    {achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at Airkrit
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center"
              >
                <value.icon className="w-12 h-12 text-[#F77124] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind Airkrit&apos;s success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100 text-center"
              >
                <div className="w-20 h-20 bg-[#F77124] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-[#F77124] font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#F77124] to-[#E65A1A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-orange-100 mb-8 leading-relaxed">
            Join thousands of students who have already transformed their
            careers with Airkrit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-white text-[#F77124] px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Browse Courses
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-[#F77124] transition-colors"
            >
              <Play className="w-5 h-5" />
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
