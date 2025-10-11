import { AppError } from "../middlewares/error.middleware";
import { LessonProgressModel, ILessonProgress } from "../models/lesson-progress.schema";
import { ModuleProgressModel, IModuleProgress } from "../models/module-progress.schema";
import { EnrollmentActivityModel, IEnrollmentActivity } from "../models/enrollment-activity.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { DetailedEnrollmentProgress, LastContentAccessed } from "../types/enrollment";
import mongoose from "mongoose";

export class ProgressService {
  /**
   * Update lesson progress
   */
  static async updateLessonProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
    completed: boolean,
    score?: number,
    timeSpent?: number
  ): Promise<ILessonProgress> {
    try {
      const lessonProgress = await LessonProgressModel.findOneAndUpdate(
        { enrollmentId, moduleId, lessonId },
        {
          completed,
          completedAt: completed ? new Date() : undefined,
          score,
          timeSpent: timeSpent ? (await this.getCurrentTimeSpent(enrollmentId, moduleId, lessonId)) + timeSpent : undefined,
          lastAccessedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Update module completion
      await this.updateModuleCompletion(enrollmentId, moduleId);
      
      // Update enrollment activity
      await this.updateEnrollmentActivity(enrollmentId, moduleId, lessonId, "document", undefined);
      
      // Update enrollment last activity
      await EnrollmentModel.findByIdAndUpdate(enrollmentId, {
        lastActivityAt: new Date(),
        totalTimeSpent: timeSpent ? (await this.getEnrollmentTotalTimeSpent(enrollmentId)) + timeSpent : undefined,
      });

      return lessonProgress;
    } catch (error) {
      throw new AppError("Failed to update lesson progress", 500);
    }
  }

  /**
   * Update module completion percentage
   */
  static async updateModuleCompletion(
    enrollmentId: string,
    moduleId: string
  ): Promise<IModuleProgress> {
    try {
      // Get all lessons in this module for this enrollment
      const lessonProgresses = await LessonProgressModel.find({
        enrollmentId,
        moduleId,
      });

      const totalLessons = lessonProgresses.length;
      const completedLessons = lessonProgresses.filter(lp => lp.completed).length;
      const completion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const moduleProgress = await ModuleProgressModel.findOneAndUpdate(
        { enrollmentId, moduleId },
        {
          completion,
          completedAt: completion === 100 ? new Date() : undefined,
          startedAt: completion > 0 ? new Date() : undefined,
        },
        { upsert: true, new: true }
      );

      // Update overall enrollment completion
      await this.updateOverallCompletion(enrollmentId);

      return moduleProgress;
    } catch (error) {
      throw new AppError("Failed to update module completion", 500);
    }
  }

  /**
   * Update overall enrollment completion
   */
  static async updateOverallCompletion(enrollmentId: string): Promise<void> {
    try {
      const moduleProgresses = await ModuleProgressModel.find({ enrollmentId });
      const totalModules = moduleProgresses.length;
      const completedModules = moduleProgresses.filter(mp => mp.completion === 100).length;
      const overallCompletion = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

      await EnrollmentModel.findByIdAndUpdate(enrollmentId, {
        "progress.overallCompletion": overallCompletion,
        "progress.totalModules": totalModules,
        "progress.completedModules": completedModules,
        lastUpdated: new Date(),
      });
    } catch (error) {
      throw new AppError("Failed to update overall completion", 500);
    }
  }

  /**
   * Update enrollment activity (last accessed content)
   */
  static async updateEnrollmentActivity(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
    contentType: "video" | "quiz" | "document",
    lastPosition?: number
  ): Promise<IEnrollmentActivity> {
    try {
      const activity = await EnrollmentActivityModel.findOneAndUpdate(
        { enrollmentId },
        {
          moduleId,
          lessonId,
          contentId: lessonId, // Assuming contentId is same as lessonId for now
          contentType,
          lastPosition,
          timestamp: new Date(),
        },
        { upsert: true, new: true }
      );

      return activity;
    } catch (error) {
      throw new AppError("Failed to update enrollment activity", 500);
    }
  }

  /**
   * Get detailed progress for an enrollment
   */
  static async getDetailedProgress(enrollmentId: string): Promise<DetailedEnrollmentProgress> {
    try {
      const enrollment = await EnrollmentModel.findById(enrollmentId);
      if (!enrollment) {
        throw new AppError("Enrollment not found", 404);
      }

      const moduleProgresses = await ModuleProgressModel.find({ enrollmentId });
      const lessonProgresses = await LessonProgressModel.find({ enrollmentId });
      const lastActivity = await EnrollmentActivityModel.findOne({ enrollmentId });

      // Group lessons by module
      const moduleProgressMap = new Map();
      moduleProgresses.forEach(mp => {
        moduleProgressMap.set(mp.moduleId, {
          moduleId: mp.moduleId,
          completion: mp.completion,
          startedAt: mp.startedAt,
          completedAt: mp.completedAt,
          lessons: [],
        });
      });

      lessonProgresses.forEach(lp => {
        const module = moduleProgressMap.get(lp.moduleId);
        if (module) {
          module.lessons.push({
            lessonId: lp.lessonId,
            completed: lp.completed,
            completedAt: lp.completedAt,
            score: lp.score,
            timeSpent: lp.timeSpent,
            lastAccessedAt: lp.lastAccessedAt,
          });
        }
      });

      return {
        enrollmentId,
        progress: enrollment.progress,
        lastContentAccessed: lastActivity ? {
          moduleId: lastActivity.moduleId,
          lessonId: lastActivity.lessonId,
          contentId: lastActivity.contentId,
          contentType: lastActivity.contentType,
          lastPosition: lastActivity.lastPosition,
          timestamp: lastActivity.timestamp,
        } : undefined,
        moduleProgress: Array.from(moduleProgressMap.values()),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get detailed progress", 500);
    }
  }

  /**
   * Get progress summary for multiple enrollments (for dashboard)
   */
  static async getProgressSummaries(enrollmentIds: string[]): Promise<Array<{
    enrollmentId: string;
    progress: any;
    lastContentAccessed?: LastContentAccessed;
  }>> {
    try {
      const enrollments = await EnrollmentModel.find({
        _id: { $in: enrollmentIds },
      }).select("_id progress");

      const activities = await EnrollmentActivityModel.find({
        enrollmentId: { $in: enrollmentIds },
      });

      const activityMap = new Map();
      activities.forEach(activity => {
        activityMap.set(activity.enrollmentId.toString(), {
          moduleId: activity.moduleId,
          lessonId: activity.lessonId,
          contentId: activity.contentId,
          contentType: activity.contentType,
          lastPosition: activity.lastPosition,
          timestamp: activity.timestamp,
        });
      });

      return enrollments.map(enrollment => ({
        enrollmentId: enrollment._id.toString(),
        progress: enrollment.progress,
        lastContentAccessed: activityMap.get(enrollment._id.toString()),
      }));
    } catch (error) {
      throw new AppError("Failed to get progress summaries", 500);
    }
  }

  /**
   * Get current time spent for a lesson
   */
  private static async getCurrentTimeSpent(
    enrollmentId: string,
    moduleId: string,
    lessonId: string
  ): Promise<number> {
    const lessonProgress = await LessonProgressModel.findOne({
      enrollmentId,
      moduleId,
      lessonId,
    });
    return lessonProgress?.timeSpent || 0;
  }

  /**
   * Get total time spent for an enrollment
   */
  private static async getEnrollmentTotalTimeSpent(enrollmentId: string): Promise<number> {
    const result = await LessonProgressModel.aggregate([
      { $match: { enrollmentId: new mongoose.Types.ObjectId(enrollmentId) } },
      { $group: { _id: null, totalTimeSpent: { $sum: "$timeSpent" } } },
    ]);
    return result[0]?.totalTimeSpent || 0;
  }

  /**
   * Delete all progress data for an enrollment
   */
  static async deleteEnrollmentProgress(enrollmentId: string): Promise<void> {
    try {
      await Promise.all([
        LessonProgressModel.deleteMany({ enrollmentId }),
        ModuleProgressModel.deleteMany({ enrollmentId }),
        EnrollmentActivityModel.deleteMany({ enrollmentId }),
      ]);
    } catch (error) {
      throw new AppError("Failed to delete enrollment progress", 500);
    }
  }
}
