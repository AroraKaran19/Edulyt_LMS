/**
 * READ-ONLY: quantify the wrongly-granted "login" welcome bonus across
 * students. Reports how many students received a `rewardSource: "login"`
 * reward entry, how many got more than one (duplicates), the points each, and
 * the grand total — so we can decide precisely what "exceed" to remove.
 *
 *   npx ts-node src/scripts/inspect-login-reward-points.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { StudentModel } from "../models/user.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const students = (await StudentModel.find({
    "successPointsHistory.rewardSource": "login",
  })
    .select("email firstName lastName successPoints successPointsHistory")
    .lean()) as any[];

  let totalLoginTx = 0;
  let totalLoginPoints = 0;
  const dupUsers: { email: string; count: number; pts: number; balance: number }[] = [];
  let firstOnlyPoints = 0; // points if we kept exactly one login reward per user
  let exceedPoints = 0; // points beyond the first login reward per user

  for (const s of students) {
    const loginTx = (s.successPointsHistory ?? []).filter(
      (t: any) => t.type === "reward" && t.rewardSource === "login",
    );
    if (loginTx.length === 0) continue;
    const pts = loginTx.reduce((a: number, t: any) => a + Number(t.points || 0), 0);
    totalLoginTx += loginTx.length;
    totalLoginPoints += pts;
    const firstPts = Number(loginTx[0].points || 0);
    firstOnlyPoints += firstPts;
    exceedPoints += pts - firstPts;
    if (loginTx.length > 1) {
      dupUsers.push({
        email: s.email,
        count: loginTx.length,
        pts,
        balance: Number(s.successPoints || 0),
      });
    }
  }

  console.log(`Students with a "login" reward: ${students.length}`);
  console.log(`Total "login" reward transactions: ${totalLoginTx}`);
  console.log(`Total points granted via "login": ${totalLoginPoints}`);
  console.log(`  • if we removed ALL login rewards:        -${totalLoginPoints}`);
  console.log(`  • if we kept one per user (remove dups):  -${exceedPoints} (keep ${firstOnlyPoints})`);
  console.log(`\nStudents who got the login reward MORE THAN ONCE: ${dupUsers.length}`);
  for (const d of dupUsers.slice(0, 50)) {
    console.log(`  ${d.email}  count=${d.count}  loginPts=${d.pts}  balance=${d.balance}`);
  }
  if (dupUsers.length > 50) console.log(`  …and ${dupUsers.length - 50} more`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
