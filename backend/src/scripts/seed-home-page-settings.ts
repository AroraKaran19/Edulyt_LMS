/**
 * Seeds the singleton home page settings document with the values that were
 * previously hardcoded inside the public homepage section components.
 *
 * Re-runs are idempotent: testimonials/FAQs are upserted by their natural
 * identity ("seed:home-page:<slot>" stored in a dedicated key on the doc), and
 * the singleton itself is upserted on `key: "global"`.
 *
 * Instructors remain unset — they reference real `User` records with login
 * credentials, so the admin should pick them via the editor.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/seed-home-page-settings.ts
 *   npm run scripts:seed-home-page
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { HomePageSettingsModel } from "../models/homePageSettings.schema";
import TestimonialModel from "../models/testimonial.schema";
import { FAQModel } from "../models/faq.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SEED_TESTIMONIALS = [
  {
    slot: "home-1",
    name: "John Doe",
    currentRole: "Software Engineer",
    currentCompany: "Google",
    linkedin: "https://www.linkedin.com/in/john-doe",
    feedback: "I love the course and it helped me get a job at Google.",
    college: "University of California, Los Angeles",
    collegeUrl: "https://www.ucla.edu",
    collegeProfileUrl: "https://www.ucla.edu/profile/john-doe",
    pastRole: "Software Engineer",
    pastCompany: "Apple",
  },
  {
    slot: "home-2",
    name: "Priya Sharma",
    currentRole: "Data Scientist",
    currentCompany: "Microsoft",
    linkedin: "https://www.linkedin.com/in/priya-sharma",
    feedback: "The mentors made all the difference — landed my dream role.",
    college: "IIT Delhi",
    collegeUrl: "https://www.iitd.ac.in",
    collegeProfileUrl: "https://www.iitd.ac.in/priya",
    pastRole: "Analyst",
    pastCompany: "Deloitte",
  },
  {
    slot: "home-3",
    name: "Aman Verma",
    currentRole: "Product Manager",
    currentCompany: "Razorpay",
    linkedin: "https://www.linkedin.com/in/aman-verma",
    feedback: "Project-based learning got me ready for real industry work.",
    college: "BITS Pilani",
    collegeUrl: "https://www.bits-pilani.ac.in",
    collegeProfileUrl: "https://www.bits-pilani.ac.in/aman",
    pastRole: "Associate",
    pastCompany: "Zomato",
  },
] as const;

const SEED_FAQ_QUESTIONS = [
  "What is Artificial Intelligence?",
  "How long are the programs?",
  "Do I get a certificate at the end?",
  "Are there real industry mentors?",
  "Is there placement assistance?",
  "Can I learn alongside a full-time job?",
];

const FAQ_ANSWER =
  "Artificial Intelligence is the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.";

async function upsertTestimonials(): Promise<mongoose.Types.ObjectId[]> {
  const ids: mongoose.Types.ObjectId[] = [];
  for (const t of SEED_TESTIMONIALS) {
    const doc = await TestimonialModel.findOneAndUpdate(
      { name: t.name, currentRole: t.currentRole, currentCompany: t.currentCompany },
      {
        $set: {
          name: t.name,
          currentRole: t.currentRole,
          currentCompany: t.currentCompany,
          linkedin: t.linkedin,
          feedback: t.feedback,
          college: t.college,
          collegeUrl: t.collegeUrl,
          collegeProfileUrl: t.collegeProfileUrl,
          pastRole: t.pastRole,
          pastCompany: t.pastCompany,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    ids.push(doc._id as unknown as mongoose.Types.ObjectId);
  }
  return ids;
}

async function upsertFaqs(): Promise<mongoose.Types.ObjectId[]> {
  const ids: mongoose.Types.ObjectId[] = [];
  for (const question of SEED_FAQ_QUESTIONS) {
    const doc = await FAQModel.findOneAndUpdate(
      { question },
      { $set: { question, answer: FAQ_ANSWER } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    ids.push(doc._id as unknown as mongoose.Types.ObjectId);
  }
  return ids;
}

function buildSettings(
  testimonialIds: mongoose.Types.ObjectId[],
  faqIds: mongoose.Types.ObjectId[],
) {
  return {
    hero: {
      topCards: [
        { title: "Who we are ?", description: "Education to Employment Experts" },
        { title: "What we do ?", description: "100% Project-Based Learning" },
        { title: "What we offer ?", description: "Industry-Focused Career Programs" },
        { title: "Why choose us ?", description: "Built From Real Industry Experience" },
      ],
      comparisonHeadingHtml:
        'The <span class="text-orange-500">Difference</span> That Gets You <span class="text-orange-500">Hired!</span>',
      comparisonRows: [
        {
          feature: "Project-based learning",
          airkrit: "100% Real Projects",
          youtube: "Mostly Theory",
          others: "Limited",
        },
        {
          feature: "Industry-Derived Curriculum",
          airkrit: "Build from Projects",
          youtube: "x",
          others: "x",
        },
        {
          feature: "Mentors Working in Industry",
          airkrit: "check",
          youtube: "x",
          others: "x",
        },
        {
          feature: "Interaction with Future Managers",
          airkrit: "check",
          youtube: "x",
          others: "x",
        },
        {
          feature: "Industry-Standard Placement Assistance",
          airkrit: "check",
          youtube: "x",
          others: "x",
        },
      ],
      exploreOfferingsLabel: "Explore Offerings",
      exploreOfferingsHref: "/courses",
    },

    student: {
      badgeLabel: "Hello Students",
      headingPrefix: "Are you feeling confused about your",
      headingHighlightCareer: "career?",
      confusionPrompts: [
        "What should I do next?",
        "How do I get a good job?",
        "What skills should I learn?",
        "Am I already too late?",
      ],
      helpCtaText: "Talk to our professionals and get clarity.",
    },

    industry: {
      headingPrimary: "One Conversation Can Change Everything.",
      headingSecondary: "You don’t need to figure it out alone.",
      helpIntroText: "Our industry experts help you in...",
      expertHelpBullets: [
        "Understanding your current level",
        "Identifying skill gaps",
        "Creating a personalized career roadmap",
      ],
      bookConsultationLabel: "Book Consultation",
      bookConsultationHref: "/contact",
      imageSrc: "/home/industry_image.jpg",
      imageAlt: "industry",
    },

    coursePathStudents: {
      eyebrow: "",
      title: "We Have Two Powerful Paths for You",
      coursesHeadingPrefix: "Our",
      coursesHeadingHighlight: "Courses",
      audience: "college-students",
    },

    internshipPath: {
      titleHighlight: "Internships Programs",
      titleRest: "Our",
    },

    testimonial: {
      eyebrow: "Hear from our past students",
      headingLine1: "Students who started",
      headingHighlight1: "just like you",
      headingLine2: "are now placed in",
      headingHighlight2: "leading companies.",
      testimonials: testimonialIds,
    },

    institutions: {
      eyebrow: "Trusted by Students from Top Institutions",
      headingHighlight: "Colleges our",
      headingRest: "students comes from",
      body: "Students from diverse academic backgrounds and leading colleges have joined our internship to gain real industry experience and practical skills. Here are some of the institutes our past interns come from.",
      institutes: Array.from({ length: 6 }, () => ({
        image: "/home/InstituteDummy.png",
        name: "Harvard University",
        line1: "Internship Participation",
        internship_student_count: 100,
        internship_spotlights: [
          {
            first_name: "John",
            last_name: "Doe",
            avatar: "",
          },
        ],
        line2: "Courses Enrollment",
        course_student_count: 100,
        course_spotlights: [
          {
            first_name: "John",
            last_name: "Doe",
            avatar: "",
          },
        ],
      })),
    },

    training: {
      eyebrow: "What Makes Our Training Different?",
      headingLine1: "A",
      headingHighlight1: "Career-Focused",
      headingLine2: "Learning Model to Make You",
      headingHighlight2: "Job-Ready",
      pillars: [
        {
          title: "Learn",
          description:
            "Master concepts through structured courses designed by industry experts. Follow a clear roadmap instead of random tutorials.",
          icon: "streamline-plump:global-learning-solid",
        },
        {
          title: "Build",
          description:
            "Work on real-world projects using real data. Gain hands-on experience that companies actually value.",
          icon: "material-symbols:build-rounded",
        },
        {
          title: "Launch",
          description:
            "Get internship opportunities, career guidance, and placement support to confidently step into your dream role.",
          icon: "material-symbols:rocket-launch",
        },
      ],
      imageSrc: "/home/training.jpg",
      imageAlt: "training",
    },

    support: {
      eyebrow: "We are Always here for your help with",
      highlights: [
        {
          title: "Instant 1:1 doubt support",
          description:
            "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
        },
        {
          title: "200+ Mentors helping learners grow faster",
          description:
            "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
        },
        {
          title: "5/5 satisfaction rating from our students",
          description:
            "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
        },
      ],
    },

    prepare: {
      eyebrow: "Everything You Need to Succeed",
      headingPrefix: "We Don’t Just Train, We",
      headingHighlight: "Prepare You.",
      items: [
        {
          title: "1:1 Mentorship Sessions",
          description:
            "Personalised support to prepare you for real job opportunities.",
          icon: "material-symbols:communication-rounded",
        },
        {
          title: "Mock Interviews",
          description:
            "Practice real interview scenarios and improve problem-solving skills.",
          icon: "icon-park-solid:communication",
        },
        {
          title: "Resume & Profile Review",
          description:
            "Get your resume reviewed by industry experts and improve your job visibility.",
          icon: "mdi:resume",
        },
        {
          title: "Soft Skills & Career Training",
          description:
            "Improve communication, confidence, and interview presence.",
          icon: "material-symbols:star-rounded",
        },
      ],
    },

    futureManagers: {
      eyebrow: "Know Your Future Managers",
      headingLearn: "Learn",
      headingHire: "From The People Who Hire.",
      instructors: [],
    },

    professional: {
      eyebrow: "Your Career Path Doesn’t End Here",
      headingLine1: "Not a",
      headingHighlightStudent: "Student Anymore?",
      headingLine2: "Already Working,",
      headingHighlightWorking: "But Not Growing?",
      promptBullets: [
        "Stuck in a Non-Tech Job?",
        "Working in a Low-Salary Role?",
        "Want to Switch to Tech?",
        "Looking to Upskill for Higher Pay?",
      ],
      helpCtaText: "We have professional courses for you",
    },

    coursePathProfessionals: {
      eyebrow: "",
      title: "Switch to Tech with Industry-Focused Programs",
      coursesHeadingPrefix: "Our",
      coursesHeadingHighlight: "Courses",
      audience: "professionals",
    },

    dreamJob: {
      eyebrow: "Land in your Dream Job",
      headingLine1: "A structured path from",
      headingHighlightLearn: "Learning",
      headingHighlightPlacement: "Placement",
      bullets: [
        "Get Placed in top companies",
        "Earn a Higher Salary",
        "Break Into Tech with Confidence",
        "Accelerate Your Career Growth",
      ],
      getStartedLabel: "Get Started Now",
      getStartedHref: "/auth/register",
      imageSrc: "/home/dream_job.png",
      imageAlt: "dream job",
    },

    pathSelection: {
      eyebrow: "It’s Time to Choose the Right Path.",
      headingHighlight: "One Decision.",
      introParagraphs: [
        "We help students and professionals move from confusion to clarity with expert guidance and practical learning.",
        "Our programs are designed around real industry demands, focusing on practical skills, hands-on projects, and job-ready training. Everything we offer is aligned toward meaningful career growth and real placement outcomes.",
      ],
      valueProps: [
        {
          title: "Industry-Led Mentorship",
          description: "Learn directly from professionals.",
        },
        {
          title: "Hands-On Projects",
          description: "Work on real-world problems.",
        },
        {
          title: "Internship Opportunities",
          description: "Learn directly from professionals.",
        },
        {
          title: "Career Support",
          description: "Resume, interviews, and placement.",
        },
      ],
    },

    faq: {
      title: "Frequently Asked Questions",
      description:
        "Dive into Artifical Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio",
      faqs: faqIds,
    },
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  await connectDB();

  try {
    console.log("Upserting seed testimonials…");
    const testimonialIds = await upsertTestimonials();
    console.log(`  ${testimonialIds.length} testimonials.`);

    console.log("Upserting seed FAQs…");
    const faqIds = await upsertFaqs();
    console.log(`  ${faqIds.length} FAQs.`);

    const settings = buildSettings(testimonialIds, faqIds);

    if (dryRun) {
      console.log("\n--dry-run: built settings document, skipping write.");
      console.log(
        "Sections:",
        Object.keys(settings).map((k) => `  - ${k}`).join("\n"),
      );
      return;
    }

    console.log("Upserting home page settings singleton…");
    await HomePageSettingsModel.findOneAndUpdate(
      { key: "global" },
      {
        $set: settings,
        $setOnInsert: { key: "global" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );

    console.log("\nDone. Home page settings seeded.");
  } finally {
    await disconnectDB();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
