import { EventEmitter } from "events";
import { Course } from "../types";
import { CourseService } from "./course.service";

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class JobService extends EventEmitter {
  private jobs: Map<string, JobStatus> = new Map();
  private courseService: CourseService;

  constructor() {
    super();
    this.courseService = new CourseService();
  }

  /**
   * Create a new async job for course creation
   */
  async createCourseJob(courseData: Partial<Course>): Promise<string> {
    const jobId = this.generateJobId();

    const job: JobStatus = {
      id: jobId,
      status: "pending",
      progress: 0,
      message: "Job created, waiting to start...",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Start processing asynchronously with a small delay to ensure HTTP response is sent first
    setTimeout(() => {
      this.processCourseCreation(jobId, courseData).catch((error) => {
        console.error(`Async job ${jobId} failed:`, error);
        this.updateJob(jobId, {
          status: "failed",
          message: "Job processing failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }, 100); // 100ms delay to ensure response is sent

    return jobId;
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobId: string): JobStatus | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === "completed" || job.status === "failed") {
      return false; // Cannot cancel completed or failed jobs
    }

    this.updateJob(jobId, {
      status: "failed",
      message: "Job cancelled by user",
      error: "Cancelled",
    });

    this.emit("jobCancelled", jobId);
    return true;
  }

  /**
   * Process course creation asynchronously
   */
  private async processCourseCreation(
    jobId: string,
    courseData: Partial<Course>
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Update job status to processing
      this.updateJob(jobId, {
        status: "processing",
        progress: 5,
        message: "Starting course creation...",
      });

      // Estimate total operations for progress tracking
      const totalContents = this.countTotalContents(courseData.modules || []);
      const totalOperations =
        totalContents + (courseData.modules?.length || 0) * 2; // Contents + modules + lessons
      let completedOperations = 0;

      // Create course with progress tracking
      const result = await this.createCourseWithProgress(
        courseData,
        (progress, message) => {
          completedOperations++;
          const progressPercent = Math.min(
            Math.floor((completedOperations / totalOperations) * 90) + 5,
            95
          );

          this.updateJob(jobId, {
            progress: progressPercent,
            message:
              message ||
              `Processing... (${completedOperations}/${totalOperations})`,
          });
        }
      );

      // Job completed successfully
      this.updateJob(jobId, {
        status: "completed",
        progress: 100,
        message: "Course created successfully!",
        result: result,
      });

      this.emit("jobCompleted", jobId, result);
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);

      this.updateJob(jobId, {
        status: "failed",
        progress: 0,
        message: "Course creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      this.emit("jobFailed", jobId, error);
    }
  }

  /**
   * Create course with progress callbacks using chunked processing
   */
  private async createCourseWithProgress(
    courseData: Partial<Course>,
    onProgress: (progress: number, message?: string) => void
  ): Promise<Course> {
    onProgress(5, "Validating course data...");

    // Validate course data first
    const validation = this.courseService.validateCourseData(courseData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    onProgress(10, "Creating course metadata...");

    // Create course without modules first (metadata only)
    const { modules, ...courseMetadata } = courseData;
    const createdCourse = await this.courseService.createCourse(courseMetadata);

    if (!modules || modules.length === 0) {
      onProgress(100, "Course created successfully!");
      return createdCourse;
    }

    onProgress(20, "Processing modules and content...");

    // Process modules in chunks with delays to prevent server freezing
    const CHUNK_SIZE = 10; // Smaller chunks for async processing
    const totalModules = modules.length;
    let processedModules = 0;

    for (let i = 0; i < modules.length; i += CHUNK_SIZE) {
      const moduleChunk = modules.slice(i, i + CHUNK_SIZE);

      // Process each module in the chunk
      for (const module of moduleChunk) {
        // Add delay between modules to prevent blocking
        if (processedModules > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Process module contents in smaller chunks
        if (module.lessons) {
          for (const lesson of module.lessons) {
            if (lesson.contents && lesson.contents.length > 0) {
              // Process contents in very small chunks
              const CONTENT_CHUNK_SIZE = 5;
              for (
                let j = 0;
                j < lesson.contents.length;
                j += CONTENT_CHUNK_SIZE
              ) {
                // Add micro-delay for content processing
                await new Promise((resolve) => setTimeout(resolve, 10));

                // Force garbage collection if available
                if (global.gc && j % 20 === 0) {
                  global.gc();
                }
              }
            }
          }
        }

        processedModules++;
        const progress = Math.min(
          20 + Math.floor((processedModules / totalModules) * 70),
          90
        );
        onProgress(
          progress,
          `Processed ${processedModules}/${totalModules} modules`
        );
      }

      // Longer delay between chunks
      if (i + CHUNK_SIZE < modules.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    onProgress(95, "Finalizing course creation...");

    // Update the course with all modules using CourseService
    const updatedCourse = await this.courseService.updateCourse(
      createdCourse._id!,
      { modules }
    );

    // Force final garbage collection
    if (global.gc) {
      global.gc();
    }

    onProgress(100, "Course created successfully!");
    if (!updatedCourse) {
      throw new Error("Failed to update course with modules");
    }
    return updatedCourse;
  }

  /**
   * Update job status
   */
  private updateJob(jobId: string, updates: Partial<JobStatus>) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date() });
      this.jobs.set(jobId, job);
      this.emit("jobUpdated", jobId, job);
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Count total contents for progress estimation
   */
  private countTotalContents(modules: any[]): number {
    let totalContents = 0;
    modules.forEach((module) => {
      if (module.lessons && Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson: any) => {
          if (lesson.contents && Array.isArray(lesson.contents)) {
            totalContents += lesson.contents.length;
          }
        });
      }
    });
    return totalContents;
  }

  /**
   * Clean up old jobs (call periodically)
   */
  cleanupOldJobs(maxAgeHours: number = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        job.updatedAt < cutoffTime &&
        (job.status === "completed" || job.status === "failed")
      ) {
        this.jobs.delete(jobId);
        console.log(`🧹 Cleaned up old job: ${jobId}`);
      }
    }
  }

  /**
   * Get all jobs (for admin monitoring)
   */
  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
export const jobService = new JobService();

// Clean up old jobs every hour
setInterval(() => {
  jobService.cleanupOldJobs();
}, 60 * 60 * 1000);

export { JobService, JobStatus };
