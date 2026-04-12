"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { usePartnershipImportConfig } from "@/hooks/usePartnershipImportConfig";
import type { PartnershipImportConfig } from "@/types/partnershipImportConfig";
import { toast } from "react-toastify";
import PartnershipImportConfigsToolbar from "./components/PartnershipImportConfigsToolbar";
import PartnershipImportConfigsTable from "./components/PartnershipImportConfigsTable";
import PartnershipImportConfigModal from "./components/PartnershipImportConfigModal";

const LIMIT = 20;

export default function PartnershipImportPage() {
  const {
    listConfigs,
    getConfigById,
    updateConfig,
    deleteConfig,
    isLoading,
  } = usePartnershipImportConfig();

  const [configs, setConfigs] = useState<PartnershipImportConfig[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PartnershipImportConfig | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = async () => {
    const result = await listConfigs({
      page,
      limit: LIMIT,
      search: searchQuery || undefined,
      isActive: filterActive,
    });
    if (result) {
      setConfigs(result.configs);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    }
  };

  useEffect(() => {
    void load();
  }, [page, searchQuery, filterActive]);

  const handleCreate = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = async (c: PartnershipImportConfig) => {
    if (!c._id) return;
    setModalMode("edit");
    const full = await getConfigById(c._id);
    setEditing(full ?? c);
    setModalOpen(true);
  };

  const handleToggleActive = async (c: PartnershipImportConfig) => {
    const next = !c.isActive;
    if (
      !confirm(
        `Are you sure you want to ${next ? "activate" : "deactivate"} this configuration?`
      )
    ) {
      return;
    }
    const r = await updateConfig(c._id!, {
      isActive: next,
      kind: c.kind,
      courses: Array.isArray(c.courses)
        ? c.courses.map((x) => (typeof x === "string" ? x : x._id!))
        : [],
      enrollmentAccess: c.enrollmentAccess ?? null,
      benefit: c.benefit ?? null,
    });
    if (r) {
      toast.success(`Configuration ${next ? "activated" : "deactivated"}`);
      void load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this configuration? Whitelist rows must be removed first.")) {
      return;
    }
    const ok = await deleteConfig(id);
    if (ok) {
      toast.success("Configuration deleted");
      void load();
    }
  };

  const hasFilters = Boolean(searchQuery) || filterActive !== undefined;

  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

  return (
    <Container
      title="Partnership import"
      description="Named partnerships: choose course enrollment or discount, then manage email lists separately from email-domain collaboration."
      className="h-full"
      classNameBody="flex flex-col gap-6 overflow-visible"
    >
      <PartnershipImportConfigsToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        filterActive={filterActive}
        onFilterChange={(v) => {
          setFilterActive(v);
          setPage(1);
        }}
        total={total}
        isLoading={isLoading}
        onRefresh={load}
        onCreate={handleCreate}
      />

      <PartnershipImportConfigsTable
        isLoading={isLoading}
        configs={configs}
        hasActiveFilters={hasFilters}
        onClearFilters={() => {
          setSearchInput("");
          setSearchQuery("");
          setFilterActive(undefined);
          setPage(1);
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {totalPages > 1 && !isLoading && configs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startItem}</span>–
            <span className="font-semibold">{endItem}</span> of{" "}
            <span className="font-semibold">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <WhiteButton
              glow={false}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </WhiteButton>
            <span className="text-sm text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            <OrangeButton
              glow={false}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </OrangeButton>
          </div>
        </div>
      )}

      <PartnershipImportConfigModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSuccess={load}
        editing={editing}
        mode={modalMode}
      />
    </Container>
  );
}
