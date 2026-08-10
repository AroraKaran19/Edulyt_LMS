export type InvoiceJobStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Order details copied onto the job when it is queued.
 */
export interface InvoiceJobSnapshot {
  /** Buyer name as the order recorded it at checkout. */
  userName?: string;
  /** Course name, or the internship title for a seat or points order. */
  itemName?: string;
  /** Amount charged, in INR, net of every discount. */
  amount?: number;
  orderKind?: string;
  paymentMethod?: string;
}

export interface InvoiceJob {
  _id?: string;
  jobId: string;
  /** Order `_id` as a string. One invoice per paid order. */
  orderId: string;
  /** Display fields as of queue time. Survives deletion of the order. */
  snapshot?: InvoiceJobSnapshot;
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
