import type { Testimonial } from "./course";
import type { FAQ } from "./faq";
import type { Instructor } from "./user";

/** Single Q&A card in the hero (Who we are / What we do / …). */
export interface HomeHeroTopCard {
  title: string;
  description: string;
}

/** One row in the hero comparison table (features vs Airkrit / YouTube / Others). */
export interface HomeHeroComparisonRow {
  feature: string;
  airkrit: string;
  youtube: string;
  others: string;
}

export interface HomeHeroSettings {
  topCards: HomeHeroTopCard[];
  comparisonHeadingHtml?: string;
  /** Table body; header columns are fixed in UI (Features, logo columns, Others). */
  comparisonRows: HomeHeroComparisonRow[];
  exploreOfferingsLabel?: string;
  exploreOfferingsHref?: string;
}

export interface HomeStudentSectionSettings {
  badgeLabel?: string;
  headingPrefix?: string;
  headingHighlightCareer?: string;
  confusionPrompts: string[];
  helpCtaText?: string;
}

export interface HomeIndustrySectionSettings {
  headingPrimary?: string;
  headingSecondary?: string;
  helpIntroText?: string;
  expertHelpBullets: string[];
  bookConsultationLabel?: string;
  bookConsultationHref?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface HomeCoursePathSettings {
  eyebrow?: string;
  title: string;
  coursesHeadingPrefix?: string;
  coursesHeadingHighlight?: string;
  audience: "college-students" | "professionals";
}

export interface HomeInternshipPathSettings {
  titleHighlight?: string;
  titleRest?: string;
}

export interface HomeTestimonialSectionSettings {
  eyebrow?: string;
  headingLine1?: string;
  headingHighlight1?: string;
  headingLine2?: string;
  headingHighlight2?: string;
  testimonials: Testimonial[];
}

/** One spotlight person on an institute tile (internship / course rows). */
export interface HomeInstituteSpotlight {
  first_name: string;
  last_name: string;
  avatar?: string;
}

/** Institute tile (trusted colleges / partner stats). */
export interface HomePageInstitute {
  image: string;
  name: string;
  line1: string;
  internship_student_count: number;
  /** People shown under the internship stat (site shows first 2, then +n). */
  internship_spotlights?: HomeInstituteSpotlight[];
  line2: string;
  course_student_count: number;
  /** People shown under the course stat (site shows first 2, then +n). */
  course_spotlights?: HomeInstituteSpotlight[];
}

export interface HomeInstitutionSectionSettings {
  eyebrow?: string;
  headingHighlight?: string;
  headingRest?: string;
  body?: string;
  institutes: HomePageInstitute[];
}

/** Card with Iconify icon name (see existing homepage sections). */
export interface HomeIconTitleCard {
  title: string;
  description: string;
  icon: string;
}

export interface HomeTrainingSectionSettings {
  eyebrow?: string;
  headingLine1?: string;
  headingHighlight1?: string;
  headingLine2?: string;
  headingHighlight2?: string;
  pillars: HomeIconTitleCard[];
  imageSrc?: string;
  imageAlt?: string;
}

export interface HomeSupportSectionSettings {
  eyebrow?: string;
  highlights: Array<{ title: string; description: string }>;
}

export interface HomePrepareSectionSettings {
  eyebrow?: string;
  headingPrefix?: string;
  headingHighlight?: string;
  items: HomeIconTitleCard[];
}

export interface HomeFutureManagerSectionSettings {
  eyebrow?: string;
  headingLearn?: string;
  headingHire?: string;
  instructors: Instructor[];
}

export interface HomeProfessionalSectionSettings {
  eyebrow?: string;
  headingLine1?: string;
  headingHighlightStudent?: string;
  headingLine2?: string;
  headingHighlightWorking?: string;
  promptBullets: string[];
  helpCtaText?: string;
}

export interface HomeDreamJobSectionSettings {
  eyebrow?: string;
  headingLine1?: string;
  headingHighlightLearn?: string;
  headingHighlightPlacement?: string;
  bullets: string[];
  getStartedLabel?: string;
  getStartedHref?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface HomePathSelectionSectionSettings {
  eyebrow?: string;
  headingHighlight?: string;
  introParagraphs: string[];
  valueProps: Array<{ title: string; description: string }>;
}

export interface HomeFaqSectionSettings {
  title?: string;
  description?: string;
  faqs: FAQ[];
}

/**
 * Aggregated CMS/API document for the marketing homepage.
 * Sections can be omitted when loading partial documents or using UI defaults.
 */
export interface HomePageSettings {
  hero?: HomeHeroSettings;
  student?: HomeStudentSectionSettings;
  industry?: HomeIndustrySectionSettings;
  coursePathStudents?: HomeCoursePathSettings;
  internshipPath?: HomeInternshipPathSettings;
  testimonial?: HomeTestimonialSectionSettings;
  institutions?: HomeInstitutionSectionSettings;
  training?: HomeTrainingSectionSettings;
  support?: HomeSupportSectionSettings;
  prepare?: HomePrepareSectionSettings;
  futureManagers?: HomeFutureManagerSectionSettings;
  professional?: HomeProfessionalSectionSettings;
  coursePathProfessionals?: HomeCoursePathSettings;
  dreamJob?: HomeDreamJobSectionSettings;
  pathSelection?: HomePathSelectionSectionSettings;
  faq?: HomeFaqSectionSettings;
}
