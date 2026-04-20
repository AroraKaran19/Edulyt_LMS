import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import favicon from "serve-favicon";
import path from "path";
import errorHandler, { notFoundHandler } from "./middlewares/error.middleware";
import cookieParser from "cookie-parser";
import {
  authRoutes,
  courseRoutes,
  orderRoutes,
  faqRoutes,
  testimonialRoutes,
  categoryRoutes,
  qnaRoutes,
  enrollmentRoutes,
  userRoutes,
  adminRoutes,
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
  internshipSubmissionRoutes,
  partnerCollegeRoutes,
} from "./routes";

dotenv.config();

const app = express();

app.use(favicon(path.join(__dirname, "../public/favicon.ico")));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Airkrit Backend Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/qna", qnaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
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
app.use("/api/internship-submissions", internshipSubmissionRoutes);
app.use("/api/partner-colleges", partnerCollegeRoutes);

app.use(notFoundHandler); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

export default app;
