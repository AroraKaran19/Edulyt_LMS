/**
 * PM2 Ecosystem Config - Horizontal Scaling
 *
 * Run: npm run build && pm2 start ecosystem.config.cjs
 *
 * This starts:
 * - 4 API instances (load balanced by PM2)
 * - worker-cert: fork — cron + certificate queue (single instance; avoid duplicate crons)
 * - worker-collab: fork — collaboration job queue (single instance): email-domain allotments,
 *   partnership-import (CSV) whitelist batching, and course-allotment jobs for import configs.
 *   There is no separate PM2 app for partnership; see dist/collaboration.worker.js.
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
      env: {
        RUN_BACKGROUND_JOBS: "true",
        CERTIFICATE_WORKER_POLL_MS: "300000",
      },
      max_memory_restart: "500M",
    },
    {
      name: "worker-collab",
      script: "dist/collaboration-worker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        RUN_BACKGROUND_JOBS: "true",
        COLLABORATION_WORKER_POLL_MS: "10000",
      },
      max_memory_restart: "500M",
    },
  ],
};
