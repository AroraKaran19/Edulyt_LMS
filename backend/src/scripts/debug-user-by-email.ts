import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import {
  UserModel,
  StudentModel,
  OrderModel,
  EnrollmentModel,
} from "../models";

dotenv.config();

const emailArg = process.argv[2];

if (!emailArg) {
  console.error("Usage: ts-node src/scripts/debug-user-by-email.ts <email>");
  process.exit(1);
}

async function main() {
  try {
    await connectDB();

    const user = await UserModel.findOne({ email: emailArg }).lean();

    if (!user) {
      console.log(`No user found with email: ${emailArg}`);
      return;
    }

    console.log("=== Base User Document ===");
    console.log(
      JSON.stringify(
        {
          _id: user._id,
          email: user.email,
          userType: (user as any).userType,
          status: (user as any).status,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          provider: (user as any).provider,
          createdAt: (user as any).createdAt,
          updatedAt: (user as any).updatedAt,
        },
        null,
        2
      )
    );

    // Try to load as student discriminator (will be null if not a student)
    const student = await StudentModel.findById(user._id)
      .populate("enrollments")
      .populate("orders")
      .populate("pendingPayments")
      .lean();

    console.log("\n=== Student Document (if any) ===");
    if (!student) {
      console.log("No student document found for this userId.");
    } else {
      console.log(
        JSON.stringify(
          {
            _id: student._id,
            collegeName: (student as any).collegeName,
            degreeName: (student as any).degreeName,
            fatherOccupation: (student as any).fatherOccupation,
            experienceLevel: (student as any).experienceLevel,
            passingYear: (student as any).passingYear,
            areaOfInterest: (student as any).areaOfInterest,
            joinSource: (student as any).joinSource,
            affiliation: (student as any).affiliation,
            enrollmentsCount: Array.isArray((student as any).enrollments)
              ? (student as any).enrollments.length
              : 0,
            ordersCount: Array.isArray((student as any).orders)
              ? (student as any).orders.length
              : 0,
            pendingPaymentsCount: Array.isArray(
              (student as any).pendingPayments
            )
              ? (student as any).pendingPayments.length
              : 0,
          },
          null,
          2
        )
      );
    }

    const userId = (user as any)._id;

    const [orders, enrollments] = await Promise.all([
      OrderModel.find({ userId }).sort({ createdAt: -1 }).lean(),
      EnrollmentModel.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    console.log("\n=== Orders for this user ===");
    console.log(
      JSON.stringify(
        orders.map((o: any) => ({
          _id: o._id,
          courseId: o.courseId,
          courseName: o.courseName,
          planType: o.planType,
          amount: o.amount,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          couponCode: o.couponCode,
          couponDiscount: o.couponDiscount,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        null,
        2
      )
    );

    console.log("\n=== Enrollments for this user ===");
    console.log(
      JSON.stringify(
        enrollments.map((e: any) => ({
          _id: e._id,
          courseId: e.courseId,
          planType: e.planType,
          status: e.status,
          enrolledAt: e.enrolledAt,
          lastUpdated: e.lastUpdated,
        })),
        null,
        2
      )
    );
  } catch (err) {
    console.error("Error while debugging user by email:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();

