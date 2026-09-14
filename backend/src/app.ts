import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import favicon from "serve-favicon";
import path from "path";
import errorHandler, { notFoundHandler } from "./middlewares/error.middleware";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors";
import { resolveBrand } from "./middlewares/brand.middleware";
import {
  authRoutes,
  emailPreferencesRoutes,
  courseRoutes,
  orderRoutes,
  faqRoutes,
  leadRoutes,
  scholarshipTestRoutes,
  scholarshipPublicRoutes,
  crmProfileRoutes,
  crmPublicRoutes,
  enquiryPublicRoutes,
  testimonialRoutes,
  categoryRoutes,
  qnaRoutes,
  notesRoutes,
  enrollmentRoutes,
  userRoutes,
  adminRoutes,
  adminStaffRoutes,
  uploadRoutes,
  instructorRoutes,
  reviewRoutes,
  webhookRoutes,
  paymentRoutes,
  liveClassesRoutes,
  authenticationMediaRoutes,
  certificateRoutes,
  couponRoutes,
  collaborationDomainRoutes,
  partnershipImportRoutes,
  instructorDashboardRoutes,
  collegeRoutes,
  internshipRoutes,
  internshipExamRoutes,
  internshipQuestionRoutes,
  internshipTaskRoutes,
  courseInternshipRoutes,
  courseInternshipEnrollmentRoutes,
  internshipSubmissionRoutes,
  internshipEnrollmentRoutes,
  partnerCollegeRoutes,
  partnerRoutes,
  questionCategoryRoutes,
  internshipVoucherRoutes,
  internshipLiveMeetingRoutes,
  homePageSettingsRoutes,
  enquiryPageSettingsRoutes,
  legalSettingsRoutes,
  announcementRoutes,
  referralRoutes,
  communityReviewRoutes,
  successPointsRoutes,
  reportRoutes,
} from "./routes";

dotenv.config();

const app = express();

app.use(favicon(path.join(__dirname, "../public/favicon.ico")));
app.use(cors(corsOptions));
app.use(
  express.json({
    limit: "100mb",
    // Razorpay signs the exact bytes it sends; the parsed body cannot be
    // re-serialized back into them (key order, whitespace, unicode escaping).
    // This keeps a reference to the buffer Express already allocated, so it
    // costs no additional memory.
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());
app.use(resolveBrand);

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Airkrit Backend Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/email-preferences", emailPreferencesRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/scholarship-tests", scholarshipTestRoutes);
app.use("/api/crm", crmProfileRoutes);
app.use("/api/crm-public", crmPublicRoutes);
app.use("/api/scholarship", scholarshipPublicRoutes);
app.use("/api/enquiry", enquiryPublicRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/qna", qnaRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api", reviewRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/live-classes", liveClassesRoutes);
app.use("/api/authentication-media", authenticationMediaRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/collaboration-domains", collaborationDomainRoutes);
app.use("/api/partnership-import-configs", partnershipImportRoutes);
app.use("/api/instructor", instructorDashboardRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/internship-exams", internshipExamRoutes);
app.use("/api/internship-questions", internshipQuestionRoutes);
app.use("/api/internship-tasks", internshipTaskRoutes);
app.use("/api/course-internships", courseInternshipRoutes);
app.use(
  "/api/course-internship-enrollments",
  courseInternshipEnrollmentRoutes,
);
app.use("/api/internship-submissions", internshipSubmissionRoutes);
app.use("/api/internship-enrollments", internshipEnrollmentRoutes);
app.use("/api/partner-colleges", partnerCollegeRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/question-categories", questionCategoryRoutes);
app.use("/api/internship-vouchers", internshipVoucherRoutes);
app.use("/api/internship-live-meetings", internshipLiveMeetingRoutes);
app.use("/api/home-page-settings", homePageSettingsRoutes);
app.use("/api/enquiry-page-settings", enquiryPageSettingsRoutes);
app.use("/api/legal-settings", legalSettingsRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/community-reviews", communityReviewRoutes);
app.use("/api/success-points", successPointsRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFoundHandler); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

export default app;
