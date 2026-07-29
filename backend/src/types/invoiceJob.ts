export type InvoiceJobStatus = "pending" | "processing" | "completed" | "failed";

export interface InvoiceJob {
  _id?: string;
  jobId: string;
  /** Order `_id` as a string. One invoice per paid order. */
  orderId: string;
  status: InvoiceJobStatus;
  /** Allocated sequence, e.g. "2627-00001". Survives retries. */
  invoiceNumber?: string;
  /** Public S3 URL of the rendered PDF once uploaded. */
  invoiceUrl?: string;
  error?: string;
  retryCount?: number;
  /** Progress percentage (0-100). */
  progress?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}
