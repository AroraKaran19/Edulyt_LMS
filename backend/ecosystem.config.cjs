/**
 * PM2 Ecosystem Config - Horizontal Scaling
 *
 * Run: npm run build && pm2 start ecosystem.config.cjs
 *
 * This starts:
 * - 4 API instances (load balanced by PM2)
 * - 1 worker instance (cron jobs + certificate generation)
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
      name: "worker",
      script: "dist/worker.js",
      instances: 1,
      env: {
        RUN_BACKGROUND_JOBS: "true",
        // Certificate worker: poll every 5 minutes (see certificate.worker.ts)
        CERTIFICATE_WORKER_POLL_MS: "300000",
      },
      max_memory_restart: "500M",
    },
  ],
};
