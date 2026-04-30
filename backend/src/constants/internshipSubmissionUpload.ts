/** Max size for learner exam/task file-upload answers (bytes). */
export const INTERNSHIP_SUBMISSION_MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * S3 key prefix for presigned uploads from learners (must match upload rules folder).
 */
export const INTERNSHIP_SUBMISSION_S3_PREFIX = "internship-submission-documents";

/** Max length for optional learner text alongside / instead of a file upload. */
export const INTERNSHIP_SUBMISSION_MAX_COMMENT_CHARS = 4000;
