"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";
import type {
  CollaborationJobRow,
  JobStatus,
  JobsResponse,
} from "./components/types";
import { CollaborationJobsFilters } from "./components/CollaborationJobsFilters";
import { CollaborationJobsTable } from "./components/CollaborationJobsTable";
import { CollaborationJobDetailModal } from "./components/CollaborationJobDetailModal";
import Pagination from "@/components/admin/Pagination";

const CollaborationJobsPage = () => {
  const [jobs, setJobs] = useState<CollaborationJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [modalJob, setModalJob] = useState<CollaborationJobRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await apiClient.get<{ data: JobsResponse }>(
        `/admin/collaboration-jobs?${params.toString()}`,
      );
      const data = response.data?.data;
      if (data) {
        setJobs(data.jobs);
        setTotal(data.total);
        setModalJob((prev) => {
          if (!prev) return null;
          const updated = data.jobs.find((j) => j.jobId === prev.jobId);
          return updated ?? prev;
        });
      } else {
        setJobs([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to fetch collaboration jobs:", err);
      toast.error("Failed to load collaboration jobs");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setModalJob(null);
  }, [page, statusFilter, searchQuery]);

  const handleRetry = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await apiClient.post(`/admin/collaboration-jobs/${jobId}/retry`);
      toast.success("Job queued for retry successfully");
      await loadJobs();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to retry job";
      toast.error(msg || "Failed to retry job");
    } finally {
      setRetryingJobId(null);
    }
  };

  const copyJobId = (jobId: string) => {
    navigator.clipboard.writeText(jobId);
    toast.success("Job ID copied to clipboard");
  };

  const copyDomainDocId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Collaboration domain ID copied");
  };

  const copyLabel = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Container
      title="Collaboration Jobs"
      description="Course-allotment jobs from the collaboration worker. Each job stores a snapshot of the collaboration domain (title and email domain) when it is created, so you can still see which partnership it refers to if the domain is deleted later."
      className="min-h-0"
      classNameBody="flex min-h-0 flex-col gap-6 overflow-x-hidden overflow-y-visible"
    >
      <CollaborationJobsFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        onRefresh={loadJobs}
        isLoading={isLoading}
        total={total}
      />

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-white p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-10 text-orange-500 animate-spin" />
            <p className="text-gray-600 font-medium">Loading jobs...</p>
            <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden" />
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="size-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No collaboration jobs found
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery
              ? `No jobs match "${searchQuery}". Try a different search.`
              : statusFilter
                ? `No jobs with status "${statusFilter}". Try a different filter.`
                : "Jobs appear when users are matched to a collaboration domain and allotments are queued."}
          </p>
          {(statusFilter || searchQuery) && (
            <WhiteButton
              onClick={() => {
                setStatusFilter("");
                setSearchInput("");
                setSearchQuery("");
                setPage(1);
              }}
            >
              Clear filters
            </WhiteButton>
          )}
        </div>
      ) : (
        <CollaborationJobsTable
          jobs={jobs}
          onOpenDetail={(job) => setModalJob(job)}
          onRetry={handleRetry}
          retryingJobId={retryingJobId}
          onCopyJobId={copyJobId}
          onCopyDomainDocId={copyDomainDocId}
        />
      )}

      <CollaborationJobDetailModal
        job={modalJob}
        isOpen={!!modalJob}
        onClose={() => setModalJob(null)}
        onRetry={handleRetry}
        retryingJobId={retryingJobId}
        onCopyLabel={copyLabel}
      />

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="pt-2"
          summary={
            <>
              Showing <span className="font-semibold">{startItem}</span>–
              <span className="font-semibold">{endItem}</span> of{" "}
              <span className="font-semibold">{total}</span>
            </>
          }
        />
      )}
    </Container>
  );
};

export default CollaborationJobsPage;
