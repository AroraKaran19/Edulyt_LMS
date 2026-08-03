import { sendOpsAlert } from "../services/opsAlert.services";
import { cleanupExpiredTokens } from "../services/auth.services";

/**
 * Poll interval (ms). Expired refresh tokens are low-urgency cleanup, so this
 * runs infrequently. Env: TOKEN_CLEANUP_WORKER_POLL_MS (default 1 hour).
 */
const POLL_INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.TOKEN_CLEANUP_WORKER_POLL_MS) || 60 * 60 * 1000,
);

/**
 * Background worker that prunes refresh tokens past their absolute (hard) cap
 * from every user.
 *
 * Uses a `$pull` so only the expired array entries are removed — the user
 * document itself is never touched. This is why a MongoDB TTL index isn't used:
 * a TTL index on an embedded array field would delete the whole user document
 * (based on the earliest date in the array), not the individual token.
 */
export const startTokenCleanupWorker = () => {
  let tickRunning = false;

  const processCleanup = async () => {
    if (tickRunning) return; // never overlap ticks
    tickRunning = true;
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      console.error("[Token Cleanup Worker] Tick error:", error);
      // Lowest stakes of the set: nothing is owed to a learner, expired tokens
      // simply accumulate. Alerted anyway because a loop that throws every tick
      // usually means the database is unreachable, which is not a small problem.
      void sendOpsAlert({
        key: "token-cleanup-worker-tick",
        title: "Token cleanup worker tick failed",
        body: [
          "Expired refresh tokens are not being pruned. Harmless in isolation, but",
          "a persistent failure here usually points at the database rather than at",
          "this worker.",
          "",
          `error: ${error instanceof Error ? error.stack || error.message : String(error)}`,
        ].join("\n"),
      });
    } finally {
      tickRunning = false;
    }
  };

  void processCleanup();
  setInterval(() => {
    void processCleanup();
  }, POLL_INTERVAL_MS);

  console.log(
    `[Token Cleanup Worker] Worker started. Poll every ${POLL_INTERVAL_MS}ms.`,
  );
};
