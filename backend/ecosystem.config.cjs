/**
 * PM2 Ecosystem Config - Horizontal Scaling
 *
 * Run: npm run build && pm2 start ecosystem.config.cjs
 *
 * This starts:
 * - 4 API instances (load balanced by PM2; RUN_BACKGROUND_JOBS=false so they
 *   don't double-poll the queues that worker-cert/worker-collab already handle)
 * - worker-cert: fork — cron + certificate queue (single instance: it owns
 *   initializeCronJobs(), so a second instance double-fires every scheduled
 *   job). See dist/certificate-worker.js.
 * - worker-offer-letter: fork — offer-letter DOCX→PDF queue (single instance).
 * - worker-invoice: fork — invoice DOCX→PDF queue (single instance). Self-gates
 *   off when NODE_ENV=development unless INVOICE_WORKER_ENABLED=true.
 * - worker-internship-eval: fork — internship certificate-evaluation queue
 *   (single instance, pure DB I/O). Inert unless
 *   INTERNSHIP_EVALUATION_ENABLED=true. A passing verdict enqueues a
 *   certificate job that worker-cert drains.
 * - worker-collab: fork — collaboration job queue (single instance):
 *   email-domain allotments, partnership-import (CSV) whitelist batching, and
 *   course-allotment jobs for import configs. There is no separate PM2 app
 *   for partnership; see dist/collaboration.worker.js. Also runs the CA worker
 *   loop (offer letters, LORs, completion certificates), so this host is a
 *   DOCX-to-PDF host too and needs the same Carlito font as worker-cert (see
 *   DEPLOYMENT.md).
 * - worker-token-cleanup: fork — prunes expired refresh tokens from user docs
 *   on a slow poll (single instance). See dist/token-cleanup-worker.js.
 *
 * Every queue worker is its own app so one wedged or memory-hungry queue can be
 * restarted without taking the crons or the other queues down with it. The
 * DOCX→PDF workers are safe to split: each conversion gets its own ephemeral
 * LibreOffice profile dir (see utils/certificateGeneratorDocx.ts), so there is
 * no soffice lock contention across processes. What splitting does NOT change is
 * total load — the *_MAX_PARALLEL caps are per-worker and were already
 * independent, so the box still sees the same peak soffice count. Size the caps
 * against the box, not against any single app's max_memory_restart.
 *
 * On max_memory_restart: PM2 samples the Node process RSS only, not spawned
 * children, so the ~100–200 MB each soffice conversion costs is NOT counted
 * here. These caps bound the Node side; box-level LibreOffice pressure is
 * governed by the *_MAX_PARALLEL env vars instead.
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
      max_memory_restart: "350M",
    },
    {
      name: "worker-offer-letter",
      script: "dist/offer-letter-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
      },
      max_memory_restart: "350M",
    },
    {
      name: "worker-invoice",
      script: "dist/invoice-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
      },
      max_memory_restart: "350M",
    },
    {
      name: "worker-role-change",
      script: "dist/role-change-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
      },
      max_memory_restart: "200M",
    },
    {
      name: "worker-internship-eval",
      script: "dist/internship-evaluation-worker.js",
      instances: 1,
      exec_mode: "fork",
      time: true,
      env: {
        RUN_BACKGROUND_JOBS: "true",
      },
      max_memory_restart: "350M",
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
        CA_WORKER_ENABLED: "true",
      },
      max_memory_restart: "350M",
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
      max_memory_restart: "350M",
    },
  ],
};
