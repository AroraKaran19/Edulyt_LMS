/**
 * PM2 Ecosystem Config - Horizontal Scaling
 *
 * Run: npm run build && pm2 start ecosystem.config.cjs
 *
 * This starts:
 * - 4 API instances (load balanced by PM2; RUN_BACKGROUND_JOBS=false so they
 *   don't double-poll the queues that worker-cert/worker-collab already handle)
 * - worker-cert: fork — cron + certificate queue + offer-letter queue +
 *   internship-evaluation queue + invoice queue (single instance; avoid
 *   duplicate crons and prevent LibreOffice contention by keeping every
 *   DOCX→PDF flow in one process). See dist/certificate-worker.js.
 *   Note: the invoice worker self-gates off when NODE_ENV=development unless
 *   INVOICE_WORKER_ENABLED=true.
 * - worker-collab: fork — collaboration job queue (single instance):
 *   email-domain allotments, partnership-import (CSV) whitelist batching, and
 *   course-allotment jobs for import configs. There is no separate PM2 app
 *   for partnership; see dist/collaboration.worker.js.
 * - worker-token-cleanup: fork — prunes expired refresh tokens from user docs
 *   on a slow poll (single instance). See dist/token-cleanup-worker.js.
 *
 * Scale API instances: pm2 scale api 8
 */

module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      instances: 4,
      exec_mode: "cluster",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "false",
      },
      max_memory_restart: "500M",
    },
    {
      name: "worker-cert",
      script: "dist/certificate-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
        CERTIFICATE_WORKER_POLL_MS: "10000",
      },
      max_memory_restart: "500M",
    },
    {
      name: "worker-collab",
      script: "dist/collaboration-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
        COLLABORATION_WORKER_POLL_MS: "10000",
      },
      max_memory_restart: "500M",
    },
    {
      name: "worker-token-cleanup",
      script: "dist/token-cleanup-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
        TOKEN_CLEANUP_WORKER_POLL_MS: "3600000",
      },
      max_memory_restart: "300M",
    },
  ],
};
