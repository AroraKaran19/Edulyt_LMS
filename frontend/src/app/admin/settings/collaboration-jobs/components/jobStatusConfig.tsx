import type { ReactNode } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import type { JobStatus } from "./types";

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="size-3.5" />,
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Loader2 className="size-3.5 animate-spin" />,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="size-3.5" />,
  },
};
