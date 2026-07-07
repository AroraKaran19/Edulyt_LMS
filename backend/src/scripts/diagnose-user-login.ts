/**
 * Read-only diagnostic: why does login fail for a given email?
 * Checks how the email is actually stored (exact vs lowercased vs
 * case-insensitive), plus provider / status / hasPassword.
 *
 * Run: npx ts-node src/scripts/diagnose-user-login.ts
 */
import mongoose from "mongoose";
import { UserModel } from "../models";
import dotenv from "dotenv";

dotenv.config();

const EMAIL = process.argv[2] || "apratikshaBTECH23@ced.alliance.edu.in";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected. Diagnosing:", EMAIL, "\n");

  const raw = EMAIL;
  const lower = EMAIL.trim().toLowerCase();

  const select = "email provider status userType createdAt";

  const exact = await UserModel.findOne({ email: raw }).select(select).lean();
  const lowered = await UserModel.findOne({ email: lower })
    .select(select)
    .lean();
  const ci = await UserModel.findOne({
    email: { $regex: `^${escapeRegex(lower)}$`, $options: "i" },
  })
    .select(select + " +password")
    .lean();

  const show = (label: string, u: unknown) => {
    if (!u) {
      console.log(`${label}\n  -> NOT FOUND`);
      return;
    }
    const x = u as Record<string, unknown> & { password?: string };
    console.log(`${label}\n  -> FOUND:`, {
      email: x.email,
      provider: x.provider,
      status: x.status,
      userType: x.userType,
      hasPassword: Boolean(x.password),
      createdAt: x.createdAt,
    });
  };

  show(`1) exact match on raw input ("${raw}")`, exact);
  show(`2) match on lowercased ("${lower}")`, lowered);
  show(`3) case-insensitive match`, ci);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("Diagnostic failed:", e);
  process.exit(1);
});
