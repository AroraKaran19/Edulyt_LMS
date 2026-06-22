"use client";

import { useState, useEffect } from "react";
import Container from "@/app/admin/components/ui/Container";
import Pagination from "@/components/admin/Pagination";
import { useCollaborationDomain } from "@/hooks/useCollaborationDomain";
import { CollaborationDomain } from "@/types/collaborationDomain";
import CollaborationDomainModal from "@/components/ui/modals/CollaborationDomainModal";
import { toast } from "react-toastify";
import CollaborationDomainsToolbar from "./components/CollaborationDomainsToolbar";
import CollaborationDomainsTable from "./components/CollaborationDomainsTable";

const LIMIT = 20;

const CollaborationDomainsPage = () => {
  const {
    getCollaborationDomains,
    updateCollaborationDomain,
    deleteCollaborationDomain,
    isLoading,
  } = useCollaborationDomain();

  const [collaborationDomains, setCollaborationDomains] = useState<
    CollaborationDomain[]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDomains, setTotalDomains] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] =
    useState<CollaborationDomain | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCollaborationDomains = async () => {
    const result = await getCollaborationDomains({
      page,
      limit: LIMIT,
      search: searchQuery,
      isActive: filterActive,
    });

    if (result) {
      setCollaborationDomains(result.collaborationDomains);
      setTotalPages(result.totalPages);
      setTotalDomains(result.total);
    }
  };

  useEffect(() => {
    loadCollaborationDomains();
  }, [page, searchQuery, filterActive]);

  const handleCreate = () => {
    setModalMode("create");
    setEditingDomain(null);
    setIsModalOpen(true);
  };

  const handleEdit = (domain: CollaborationDomain) => {
    setModalMode("edit");
    setEditingDomain(domain);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (domain: CollaborationDomain) => {
    const newStatus = !domain.isActive;
    const action = newStatus ? "activate" : "pause";

    if (
      !confirm(`Are you sure you want to ${action} this collaboration domain?`)
    ) {
      return;
    }

    const result = await updateCollaborationDomain(domain._id!, {
      isActive: newStatus,
      collaborationKind: domain.collaborationKind,
    });
    if (result) {
      toast.success(`Collaboration domain ${action}d successfully!`);
      loadCollaborationDomains();
    }
  };

  const handleDelete = async (collaborationDomainId: string) => {
    if (
      !confirm("Are you sure you want to delete this collaboration domain?")
    ) {
      return;
    }

    const result = await deleteCollaborationDomain(collaborationDomainId);
    if (result) {
      toast.success("Collaboration domain deleted successfully!");
      loadCollaborationDomains();
    }
  };

  const handleModalSuccess = () => {
    loadCollaborationDomains();
  };

  const hasActiveFilters =
    Boolean(searchQuery) || filterActive !== undefined;

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setFilterActive(undefined);
    setPage(1);
  };

  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalDomains);

  return (
    <Container
      title="Collaboration domains"
      description="College email domains, linked courses, and partnership pricing"
      className="h-full"
      classNameBody="flex flex-col gap-6 overflow-visible"
    >
      <CollaborationDomainsToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        filterActive={filterActive}
        onFilterChange={(value) => {
          setFilterActive(value);
          setPage(1);
        }}
        total={totalDomains}
        isLoading={isLoading}
        onRefresh={loadCollaborationDomains}
        onAddDomain={handleCreate}
      />

      <CollaborationDomainsTable
        isLoading={isLoading}
        domains={collaborationDomains}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onAddDomain={handleCreate}
        onToggleActive={handleToggleActive}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {!isLoading && collaborationDomains.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="pt-2"
          summary={
            <>
              Showing <span className="font-semibold">{startItem}</span>–
              <span className="font-semibold">{endItem}</span> of{" "}
              <span className="font-semibold">{totalDomains}</span>
            </>
          }
        />
      )}

      <CollaborationDomainModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDomain(null);
        }}
        onSuccess={handleModalSuccess}
        editingDomain={editingDomain}
        mode={modalMode}
      />
    </Container>
  );
};

export default CollaborationDomainsPage;
