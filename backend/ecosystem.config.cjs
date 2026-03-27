/**
 * PM2 Ecosystem Config - Horizontal Scaling
 *
 * Run: npm run build && pm2 start ecosystem.config.cjs
 *
 * This starts:
 * - 4 API instances (load balanced by PM2)
 * - worker-cert: fork — cron + certificate queue (single instance; avoid duplicate crons)
 * - worker-collab: fork — collaboration allotment queue (single instance)
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
        COLLABORATION_WORKER_POLL_MS: "120000",
      },
      max_memory_restart: "500M",
    },
  ],
};
