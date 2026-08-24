/**
 * PM2 process: role-change purge queue.
 *
 * Cheap and DB-only, but it must run somewhere: a queued job that nothing
 * processes leaves the account half-changed, and `assertNoRoleChangeInFlight`
 * then blocks every later role change for that person.
 *
 * Run: node dist/role-change-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { startRoleChangeWorker } from "./workers/roleChange.worker";
import {
  installWorkerCrashAlerts,
  reportWorkerStartupFailure,
} from "./lib/workerProcessGuards";
import dotenv from "dotenv";

dotenv.config();

const PROCESS_NAME = "role-change worker";

const start = async () => {
  installWorkerCrashAlerts(PROCESS_NAME);

  try {
    await connectDB();

    startRoleChangeWorker();
    console.log("✅ Role-change worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down role-change worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    await reportWorkerStartupFailure(PROCESS_NAME, error);
    process.exit(1);
  }
};

void start();
