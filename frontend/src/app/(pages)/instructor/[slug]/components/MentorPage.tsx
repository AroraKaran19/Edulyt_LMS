"use client";

import React, { useMemo } from "react";
import MentorSidebar from "./MentorSidebar";
import MentorAboutSection from "./MentorAboutSection";
import MentorCoursesSection from "./MentorCoursesSection";
import { mentorProfiles } from "@/constants/internshipData";
import { Course, Instructor } from "@/types";

const buildMockInstructor = (name: string): Instructor => {
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ");

  return {
    status: "active",
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    password: "********",
    userType: "instructor",
    provider: "credentials",
    accounts: {},
    rating: 5,
    totalStudents: 35000,
    firstName,
    lastName: lastName || undefined,
    profilePicture:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    reviews: [],
    ownedCourses: [],
    linkedinUrl: "https://www.linkedin.com/",
    bio: "",
    field: "",
    currentPosition: "Product Designer",
    currentCompany: "Google",
    previousExperience: [],
    permissions: [],
    refreshTokens: [],
  };
};

const buildMockCourse = (overrides: Partial<Course>): Course => {
  const baseCourse: Course = {
    _id: "mock-id",
    title: "Data Science: Zero to Hundred",
    description:
      "Mock course description for UI preview. Replace with real data when API integration is added.",
    shortDescription: "Mock short description for UI preview.",
    category: [],
    thumbnail:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80",
    isFeatured: true,
    whatYouWillLearn: "Mock learning outcomes",
    skills: ["Python", "Machine Learning", "Statistics"],
    highlights: [
      { title: "Hands-on projects", description: "Build real projects" },
      { title: "Mentor support", description: "Get feedback and guidance" },
    ],
    careerPaths: ["Data Scientist", "ML Engineer"],
    skillLevel: "Beginner",
    whoShouldJoin: "Students and professionals looking to upskill",
    duration: "4 weeks",
    instructor: [buildMockInstructor("John Doe")],
    plans: {
      essential: {
        title: "Essential",
        type: "essential",
        price: 500,
        features: [],
        discount: {
          discount: "percentage",
          value: 50,
          isActive: true,
        },
        isActive: true,
      },
    },
    reviews: [],
    testimonials: [],
    faqs: [],
    isActive: true,
    createdBy: null,
    audience: "college-students",
    slug: "data-science-zero-to-hundred",
    language: "English",
  };

  return { ...baseCourse, ...overrides };
};

const MentorPage = ({ slug }: { slug: string }) => {
  const mentor = mentorProfiles?.[0];

  const courses = useMemo<Course[]>(
    () => [
      buildMockCourse({ slug: `${slug}-course-1` }),
      buildMockCourse({ slug: `${slug}-course-2`, isFeatured: true }),
      buildMockCourse({ slug: `${slug}-course-3`, isFeatured: false }),
      buildMockCourse({ slug: `${slug}-course-4`, isFeatured: true }),
    ],
    [slug]
  );

  const mentorName = mentor?.name || "John Doe";
  const mentorTitle = "Product Designer";
  const mentorImage =
    mentor?.profileImage ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80";

  return (
    <main className="bg-[#f3f3f3]">
      <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <MentorSidebar
                name={mentorName}
                title={mentorTitle}
                profileImage={mentorImage}
                socials={{
                  linkedin: mentor?.linkedinUrl || "https://www.linkedin.com/",
                  instagram: "https://www.instagram.com/",
                }}
                totalExperienceLabel="14+ years"
                experience={[
                  { company: "Google", role: "Product Designer", years: "2003 - 14" },
                  { company: "Google", role: "Product Designer", years: "2003 - 14" },
                  { company: "Google", role: "Product Designer", years: "2003 - 14" },
                  { company: "Google", role: "Product Designer", years: "2003 - 14" },
                ]}
                className="max-w-md mx-auto lg:max-w-none"
              />
            </div>
          </div>

          <div className="lg:col-span-9 flex flex-col gap-6">
            <MentorAboutSection
              stats={[
                { value: "600+ hrs", label: "Learning content" },
                { value: "27+", label: "Languages & tools" },
                { value: "4 weeks", label: "Capstone project" },
              ]}
              description={
                "The curriculum, designed by the faculty of Texas McCombs, Great Learning, and leading industry practitioners, is taught by the best-in-class professors and practicing industry experts. The objective of this AI course is to familiarize learners with the concepts of AI, machine learning, and generative AI necessary to establish their career or transition to a career in the field of AI and machine learning."
              }
            />

            <MentorCoursesSection courses={courses} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default MentorPage;
