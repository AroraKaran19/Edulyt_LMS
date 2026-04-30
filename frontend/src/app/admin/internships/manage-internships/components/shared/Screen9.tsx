import React, { useState, useEffect, useCallback } from "react";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import {
  Plus,
  Search,
  Building2,
  Check,
  X,
  Edit3,
  Trash2,
  UserIcon,
} from "lucide-react";
import { PartnerCollege, StudentProfile } from "@/types/partner-college";
import { usePartnerCollege } from "@/hooks/usePartnerCollege";
import { useFormContext } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { useUpload } from "@/hooks/useUpload";

const IMAGE_UPLOAD_FORMATS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const Screen9 = () => {
  const {
    setValue,
    watch,
  } = useFormContext<InternshipFormData>();

  const {
    getPartnerColleges,
    createPartnerCollege,
    updatePartnerCollege,
    deletePartnerCollege,
    isLoading,
    clearError,
  } = usePartnerCollege();

  const {
    uploadFile,
    deleteFile,
    isUploading,
    error: uploadError,
  } = useUpload();

  const [partnerColleges, setPartnerColleges] = useState<PartnerCollege[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPartnerCollege, setNewPartnerCollege] = useState<Omit<PartnerCollege, "_id">>({
    name: "",
    website: "",
    image: "",
    internshipStudents: { count: 0, students: [] },
    coursesEnrollment: { count: 0, students: [] },
  });
  const [newImageSource, setNewImageSource] = useState<"upload" | "url">("url");
  const [newImageS3Key, setNewImageS3Key] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPartnerCollege, setEditingPartnerCollege] =
    useState<PartnerCollege | null>(null);
  const [editImageSource, setEditImageSource] = useState<"upload" | "url">("url");
  const [editImageS3Key, setEditImageS3Key] = useState("");
  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const partnerCollegesValue = watch("partnerColleges") || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(partnerCollegesValue);

  const [isMounted, setIsMounted] = useState(false);

  const slugValue = watch("slug");
  const titleValue = watch("title");
  const [baseFolder, setBaseFolder] = useState("internships/new_internship");

  useEffect(() => {
    const raw = (slugValue || titleValue || "").trim();
    if (raw) {
      const base = raw.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setBaseFolder(`internships/${base}`);
    }
  }, [slugValue, titleValue]);

  useEffect(() => {
    if (
      isMounted &&
      partnerCollegesValue.length > 0 &&
      selectedIds.length === 0
    ) {
      setSelectedIds(partnerCollegesValue);
    }
  }, [partnerCollegesValue, isMounted, selectedIds.length]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPartnerColleges([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadPartnerColleges(1, true);
  }, [searchDebounced]);

  const loadPartnerColleges = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getPartnerColleges({
          page: pageNum,
          limit: 10,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setPartnerColleges(result.partnerColleges);
          } else {
            setPartnerColleges((prev) => [
              ...prev,
              ...result.partnerColleges,
            ]);
          }

          setHasMore(
            result.partnerColleges.length === 10 &&
            partnerColleges.length + result.partnerColleges.length < result.total
          );
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading partner colleges:", error);
      }
    },
    [isLoading, searchDebounced, getPartnerColleges, clearError, partnerColleges.length]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasMore &&
        !isLoading
      ) {
        loadPartnerColleges(page);
      }
    },
    [hasMore, isLoading, page, loadPartnerColleges]
  );

  useEffect(() => {
    loadPartnerColleges(1, true);
  }, []);

  const handleToggle = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];

    setSelectedIds(newSelected);
    setValue("partnerColleges", newSelected, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleCreate = async () => {
    if (!newPartnerCollege.name.trim() || !newPartnerCollege.website.trim() || !newPartnerCollege.image.trim()) return;

    setCreating(true);
    try {
      const created = await createPartnerCollege(newPartnerCollege);
      if (created) {
        setPartnerColleges((prev) => [created, ...prev]);
        setNewPartnerCollege({
          name: "",
          website: "",
          image: "",
          internshipStudents: { count: 0, students: [] },
          coursesEnrollment: { count: 0, students: [] },
        });
        setNewImageSource("url");
        setNewImageS3Key("");
        setShowCreateModal(false);
        clearError();
      }
    } catch (error) {
      console.error("Error creating partner college:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (pc: PartnerCollege) => {
    setEditingPartnerCollege(pc);
    setEditImageSource("url");
    setEditImageS3Key("");
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingPartnerCollege || !editingPartnerCollege._id || !editingPartnerCollege.name.trim()) return;

    setUpdating(true);
    try {
      const result = await updatePartnerCollege(editingPartnerCollege._id, editingPartnerCollege);

      if (result) {
        setPartnerColleges((prev) =>
          prev.map((pc) => (pc._id === editingPartnerCollege._id ? result : pc))
        );
        setShowEditModal(false);
        setEditingPartnerCollege(null);
        setEditImageSource("url");
        setEditImageS3Key("");
        clearError();
      }
    } catch (error) {
      console.error("Error updating partner college:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner college? This action cannot be undone.")) return;

    setDeletingId(id);
    try {
      const result = await deletePartnerCollege(id);

      if (result) {
        setPartnerColleges((prev) => prev.filter((pc) => pc._id !== id));

        const newSelected = selectedIds.filter((sid) => sid !== id);
        setSelectedIds(newSelected);
        setValue("partnerColleges", newSelected, {
          shouldDirty: true,
          shouldTouch: true,
        });

        clearError();
      }
    } catch (error) {
      console.error("Error deleting partner college:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const addInternshipStudent = () => {
    setNewPartnerCollege((prev) => ({
      ...prev,
      internshipStudents: {
        ...prev.internshipStudents,
        students: [...prev.internshipStudents.students, { name: "", image: "" }],
      },
    }));
  };

  const removeInternshipStudent = (index: number) => {
    setNewPartnerCollege((prev) => ({
      ...prev,
      internshipStudents: {
        ...prev.internshipStudents,
        students: prev.internshipStudents.students.filter((_, i) => i !== index),
      },
    }));
  };

  const addCoursesStudent = () => {
    setNewPartnerCollege((prev) => ({
      ...prev,
      coursesEnrollment: {
        ...prev.coursesEnrollment,
        students: [...prev.coursesEnrollment.students, { name: "", image: "" }],
      },
    }));
  };

  const removeCoursesStudent = (index: number) => {
    setNewPartnerCollege((prev) => ({
      ...prev,
      coursesEnrollment: {
        ...prev.coursesEnrollment,
        students: prev.coursesEnrollment.students.filter((_, i) => i !== index),
      },
    }));
  };

  const addEditInternshipStudent = () => {
    if (!editingPartnerCollege) return;
    setEditingPartnerCollege({
      ...editingPartnerCollege,
      internshipStudents: {
        ...editingPartnerCollege.internshipStudents,
        students: [...editingPartnerCollege.internshipStudents.students, { name: "", image: "" }],
      },
    });
  };

  const removeEditInternshipStudent = (index: number) => {
    if (!editingPartnerCollege) return;
    setEditingPartnerCollege({
      ...editingPartnerCollege,
      internshipStudents: {
        ...editingPartnerCollege.internshipStudents,
        students: editingPartnerCollege.internshipStudents.students.filter((_, i) => i !== index),
      },
    });
  };

  const addEditCoursesStudent = () => {
    if (!editingPartnerCollege) return;
    setEditingPartnerCollege({
      ...editingPartnerCollege,
      coursesEnrollment: {
        ...editingPartnerCollege.coursesEnrollment,
        students: [...editingPartnerCollege.coursesEnrollment.students, { name: "", image: "" }],
      },
    });
  };

  const removeEditCoursesStudent = (index: number) => {
    if (!editingPartnerCollege) return;
    setEditingPartnerCollege({
      ...editingPartnerCollege,
      coursesEnrollment: {
        ...editingPartnerCollege.coursesEnrollment,
        students: editingPartnerCollege.coursesEnrollment.students.filter((_, i) => i !== index),
      },
    });
  };

  if (!isMounted) {
    return (
      <Container
        title="Partner Colleges (Screen 9)"
        description="Select partner colleges for your internship"
        icon={Building2}
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
            Loading...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Partner Colleges (Screen 9)"
      description={`Select partner colleges for your internship (${selectedIds.length} selected, max 6)`}
      icon={Building2}
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              placeholder="Search partner colleges..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WhiteButton
            onClick={() => {
              const allIds = partnerColleges
                .map((pc) => pc._id)
                .filter((id): id is string => !!id)
                .slice(0, 6 - selectedIds.length);
              const newSelected = [...selectedIds, ...allIds].slice(0, 6);
              setSelectedIds(newSelected);
              setValue("partnerColleges", newSelected, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
            className="flex items-center gap-2"
            disabled={!partnerColleges.length || selectedIds.length >= 6}
          >
            <Check className="w-4 h-4" />
            Select All
          </WhiteButton>
          <WhiteButton
            onClick={() => {
              setSelectedIds([]);
              setValue("partnerColleges", [], {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
            className="flex items-center gap-2"
            disabled={selectedIds.length === 0}
          >
            <X className="w-4 h-4" />
            Clear All
          </WhiteButton>
          <OrangeButton
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
            glow={false}
          >
            <Plus className="w-4 h-4" />
            Create Partner College
          </OrangeButton>
        </div>
      </div>

      {selectedIds.length >= 6 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          Maximum of 6 partner colleges reached. Deselect one to add more.
        </div>
      )}

      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3"
        style={{ maxHeight: "calc(100vh - 400px)" }}
      >
        {partnerColleges.map((pc) => {
          const isSelected = selectedIds.includes(pc._id || "");
          const canSelect = !isSelected && selectedIds.length < 6;

          return (
            <div
              key={pc._id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(pc._id || "")}
                  disabled={!canSelect && !isSelected}
                  className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {pc.image && (
                      <img
                        src={pc.image}
                        alt={pc.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {pc.name}
                      </h4>
                      <a
                        href={pc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {pc.website}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Internship Students: {pc.internshipStudents.count}</span>
                    <span>Course Enrollments: {pc.coursesEnrollment.count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(pc)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pc._id || "")}
                    disabled={deletingId === pc._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && partnerColleges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No partner colleges found. Create one to get started.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create New Partner College
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Name"
                  value={newPartnerCollege.name}
                  onChange={(e) =>
                    setNewPartnerCollege((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Partner college name"
                  required
                />
                <Input
                  label="Website"
                  value={newPartnerCollege.website}
                  onChange={(e) =>
                    setNewPartnerCollege((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://example.edu"
                  required
                />
                
                <UploadMediaContainer
                  title="Logo Image"
                  description="Upload partner college logo"
                  type="image"
                  folderName={`${baseFolder}/partner_colleges`}
                  mediaUrl={newPartnerCollege.image}
                  mediaSource={newImageSource}
                  s3Key={newImageS3Key}
                  onFileUpload={async (file, folder) => {
                    try {
                      const result = await uploadFile(file, folder);
                      if (result.success && result.data?.url) {
                        setNewPartnerCollege((prev) => ({ ...prev, image: result.data!.url }));
                        setNewImageS3Key(result.data.s3Key ?? "");
                        setNewImageSource("upload");
                        return result.data.url;
                      }
                      throw new Error(result.error || "Upload failed");
                    } catch (err) {
                      setNewPartnerCollege((prev) => ({ ...prev, image: "" }));
                      setNewImageS3Key("");
                      throw err;
                    }
                  }}
                  onFileRemove={async () => {
                    if (newImageS3Key && newImageSource === "upload") {
                      try {
                        await deleteFile(newImageS3Key);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    setNewPartnerCollege((prev) => ({ ...prev, image: "" }));
                    setNewImageS3Key("");
                    setNewImageSource("url");
                  }}
                  allowUrlInput={true}
                  showConfirmation={false}
                  maxSize={20}
                  acceptedFormats={IMAGE_UPLOAD_FORMATS}
                  error={uploadError}
                  isUploading={isUploading}
                  required
                  className="w-full"
                />
              </div>

              {/* Internship Students */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <UserIcon className="size-4" />
                    Internship Students
                  </h4>
                </div>
                <div className="mb-3">
                  <Input
                    label="Count"
                    type="number"
                    value={newPartnerCollege.internshipStudents.count}
                    onChange={(e) =>
                      setNewPartnerCollege((prev) => ({
                        ...prev,
                        internshipStudents: {
                          ...prev.internshipStudents,
                          count: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700">Students</p>
                  {newPartnerCollege.internshipStudents.students.map((student, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-3">
                        <Input
                          label="Student name"
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => {
                            const newStudents = [...newPartnerCollege.internshipStudents.students];
                            newStudents[index].name = e.target.value;
                            setNewPartnerCollege((prev) => ({
                              ...prev,
                              internshipStudents: {
                                ...prev.internshipStudents,
                                students: newStudents,
                              },
                            }));
                          }}
                        />
                        <UploadMediaContainer
                          title="Student Image"
                          description="Upload student profile image (optional)"
                          type="image"
                          folderName={`${baseFolder}/students/internship_${index}`}
                          mediaUrl={student.image || ""}
                          mediaSource="url"
                          s3Key=""
                          onFileUpload={async (file, folder) => {
                            try {
                              const result = await uploadFile(file, folder);
                              if (result.success && result.data?.url) {
                                const newStudents = [...newPartnerCollege.internshipStudents.students];
                                newStudents[index].image = result.data.url;
                                setNewPartnerCollege((prev) => ({
                                  ...prev,
                                  internshipStudents: {
                                    ...prev.internshipStudents,
                                    students: newStudents,
                                  },
                                }));
                                return result.data.url;
                              }
                              throw new Error(result.error || "Upload failed");
                            } catch (err) {
                              throw err;
                            }
                          }}
                          onFileRemove={async () => {
                            const newStudents = [...newPartnerCollege.internshipStudents.students];
                            newStudents[index].image = "";
                            setNewPartnerCollege((prev) => ({
                              ...prev,
                              internshipStudents: {
                                ...prev.internshipStudents,
                                students: newStudents,
                              },
                            }));
                          }}
                          allowUrlInput={true}
                          showConfirmation={false}
                          maxSize={10}
                          acceptedFormats={IMAGE_UPLOAD_FORMATS}
                          isUploading={isUploading}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInternshipStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0 mt-6 cursor-pointer"
                        title="Remove student"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <WhiteButton
                    type="button"
                    glow={false}
                    className="flex items-center gap-2"
                    onClick={addInternshipStudent}
                  >
                    <Plus className="size-4" />
                    Add student
                  </WhiteButton>
                </div>
              </div>

              {/* Courses Enrollment */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <UserIcon className="size-4" />
                    Courses Enrollment
                  </h4>
                </div>
                <div className="mb-3">
                  <Input
                    label="Count"
                    type="number"
                    value={newPartnerCollege.coursesEnrollment.count}
                    onChange={(e) =>
                      setNewPartnerCollege((prev) => ({
                        ...prev,
                        coursesEnrollment: {
                          ...prev.coursesEnrollment,
                          count: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700">Students</p>
                  {newPartnerCollege.coursesEnrollment.students.map((student, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-3">
                        <Input
                          label="Student name"
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => {
                            const newStudents = [...newPartnerCollege.coursesEnrollment.students];
                            newStudents[index].name = e.target.value;
                            setNewPartnerCollege((prev) => ({
                              ...prev,
                              coursesEnrollment: {
                                ...prev.coursesEnrollment,
                                students: newStudents,
                              },
                            }));
                          }}
                        />
                        <UploadMediaContainer
                          title="Student Image"
                          description="Upload student profile image (optional)"
                          type="image"
                          folderName={`${baseFolder}/students/courses_${index}`}
                          mediaUrl={student.image || ""}
                          mediaSource="url"
                          s3Key=""
                          onFileUpload={async (file, folder) => {
                            try {
                              const result = await uploadFile(file, folder);
                              if (result.success && result.data?.url) {
                                const newStudents = [...newPartnerCollege.coursesEnrollment.students];
                                newStudents[index].image = result.data.url;
                                setNewPartnerCollege((prev) => ({
                                  ...prev,
                                  coursesEnrollment: {
                                    ...prev.coursesEnrollment,
                                    students: newStudents,
                                  },
                                }));
                                return result.data.url;
                              }
                              throw new Error(result.error || "Upload failed");
                            } catch (err) {
                              throw err;
                            }
                          }}
                          onFileRemove={async () => {
                            const newStudents = [...newPartnerCollege.coursesEnrollment.students];
                            newStudents[index].image = "";
                            setNewPartnerCollege((prev) => ({
                              ...prev,
                              coursesEnrollment: {
                                ...prev.coursesEnrollment,
                                students: newStudents,
                              },
                            }));
                          }}
                          allowUrlInput={true}
                          showConfirmation={false}
                          maxSize={10}
                          acceptedFormats={IMAGE_UPLOAD_FORMATS}
                          isUploading={isUploading}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCoursesStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0 mt-6"
                        title="Remove student"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <WhiteButton
                    type="button"
                    glow={false}
                    className="flex items-center gap-2"
                    onClick={addCoursesStudent}
                  >
                    <Plus className="size-4" />
                    Add student
                  </WhiteButton>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <WhiteButton
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </WhiteButton>
                <OrangeButton
                  onClick={handleCreate}
                  disabled={creating || isUploading}
                  className="flex-1"
                  glow={false}
                >
                  {creating ? "Creating..." : "Create"}
                </OrangeButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar structure */}
      {showEditModal && editingPartnerCollege && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit Partner College
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Name"
                  value={editingPartnerCollege.name}
                  onChange={(e) =>
                    setEditingPartnerCollege((prev) => prev ? { ...prev, name: e.target.value } : null)
                  }
                  placeholder="Partner college name"
                  required
                />
                <Input
                  label="Website"
                  value={editingPartnerCollege.website}
                  onChange={(e) =>
                    setEditingPartnerCollege((prev) => prev ? { ...prev, website: e.target.value } : null)
                  }
                  placeholder="https://example.edu"
                  required
                />
                
                <UploadMediaContainer
                  title="Logo Image"
                  description="Upload partner college logo"
                  type="image"
                  folderName={`${baseFolder}/partner_colleges`}
                  mediaUrl={editingPartnerCollege.image}
                  mediaSource={editImageSource}
                  s3Key={editImageS3Key}
                  onFileUpload={async (file, folder) => {
                    try {
                      const result = await uploadFile(file, folder);
                      if (result.success && result.data?.url) {
                        setEditingPartnerCollege((prev) => prev ? { ...prev, image: result.data!.url } : null);
                        setEditImageS3Key(result.data.s3Key ?? "");
                        setEditImageSource("upload");
                        return result.data.url;
                      }
                      throw new Error(result.error || "Upload failed");
                    } catch (err) {
                      setEditingPartnerCollege((prev) => prev ? { ...prev, image: "" } : null);
                      setEditImageS3Key("");
                      throw err;
                    }
                  }}
                  onFileRemove={async () => {
                    if (editImageS3Key && editImageSource === "upload") {
                      try {
                        await deleteFile(editImageS3Key);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    setEditingPartnerCollege((prev) => prev ? { ...prev, image: "" } : null);
                    setEditImageS3Key("");
                    setEditImageSource("url");
                  }}
                  allowUrlInput={true}
                  showConfirmation={false}
                  maxSize={20}
                  acceptedFormats={IMAGE_UPLOAD_FORMATS}
                  error={uploadError}
                  isUploading={isUploading}
                  required
                  className="w-full"
                />
              </div>

              {/* Internship Students - Edit */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <UserIcon className="size-4" />
                    Internship Students
                  </h4>
                </div>
                <div className="mb-3">
                  <Input
                    label="Count"
                    type="number"
                    value={editingPartnerCollege.internshipStudents.count}
                    onChange={(e) =>
                      setEditingPartnerCollege((prev) => prev ? {
                        ...prev,
                        internshipStudents: {
                          ...prev.internshipStudents,
                          count: parseInt(e.target.value) || 0,
                        },
                      } : null)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700">Students</p>
                  {editingPartnerCollege.internshipStudents.students.map((student, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-3">
                        <Input
                          label="Student name"
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => {
                            if (!editingPartnerCollege) return;
                            const newStudents = [...editingPartnerCollege.internshipStudents.students];
                            newStudents[index].name = e.target.value;
                            setEditingPartnerCollege({
                              ...editingPartnerCollege,
                              internshipStudents: {
                                ...editingPartnerCollege.internshipStudents,
                                students: newStudents,
                              },
                            });
                          }}
                        />
                        <UploadMediaContainer
                          title="Student Image"
                          description="Upload student profile image (optional)"
                          type="image"
                          folderName={`${baseFolder}/students/edit_internship_${index}`}
                          mediaUrl={student.image || ""}
                          mediaSource="url"
                          s3Key=""
                          onFileUpload={async (file, folder) => {
                            try {
                              const result = await uploadFile(file, folder);
                              if (result.success && result.data?.url) {
                                if (!editingPartnerCollege) return result.data.url;
                                const newStudents = [...editingPartnerCollege.internshipStudents.students];
                                newStudents[index].image = result.data.url;
                                setEditingPartnerCollege({
                                  ...editingPartnerCollege,
                                  internshipStudents: {
                                    ...editingPartnerCollege.internshipStudents,
                                    students: newStudents,
                                  },
                                });
                                return result.data.url;
                              }
                              throw new Error(result.error || "Upload failed");
                            } catch (err) {
                              throw err;
                            }
                          }}
                          onFileRemove={async () => {
                            if (!editingPartnerCollege) return;
                            const newStudents = [...editingPartnerCollege.internshipStudents.students];
                            newStudents[index].image = "";
                            setEditingPartnerCollege({
                              ...editingPartnerCollege,
                              internshipStudents: {
                                ...editingPartnerCollege.internshipStudents,
                                students: newStudents,
                              },
                            });
                          }}
                          allowUrlInput={true}
                          showConfirmation={false}
                          maxSize={10}
                          acceptedFormats={IMAGE_UPLOAD_FORMATS}
                          isUploading={isUploading}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditInternshipStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0 mt-6 cursor-pointer"
                        title="Remove student"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <WhiteButton
                    type="button"
                    glow={false}
                    className="flex items-center gap-2"
                    onClick={addEditInternshipStudent}
                  >
                    <Plus className="size-4" />
                    Add student
                  </WhiteButton>
                </div>
              </div>

              {/* Courses Enrollment - Edit */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <UserIcon className="size-4" />
                    Courses Enrollment
                  </h4>
                </div>
                <div className="mb-3">
                  <Input
                    label="Count"
                    type="number"
                    value={editingPartnerCollege.coursesEnrollment.count}
                    onChange={(e) =>
                      setEditingPartnerCollege((prev) => prev ? {
                        ...prev,
                        coursesEnrollment: {
                          ...prev.coursesEnrollment,
                          count: parseInt(e.target.value) || 0,
                        },
                      } : null)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700">Students</p>
                  {editingPartnerCollege.coursesEnrollment.students.map((student, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-3">
                        <Input
                          label="Student name"
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => {
                            if (!editingPartnerCollege) return;
                            const newStudents = [...editingPartnerCollege.coursesEnrollment.students];
                            newStudents[index].name = e.target.value;
                            setEditingPartnerCollege({
                              ...editingPartnerCollege,
                              coursesEnrollment: {
                                ...editingPartnerCollege.coursesEnrollment,
                                students: newStudents,
                              },
                            });
                          }}
                        />
                        <UploadMediaContainer
                          title="Student Image"
                          description="Upload student profile image (optional)"
                          type="image"
                          folderName={`${baseFolder}/students/edit_courses_${index}`}
                          mediaUrl={student.image || ""}
                          mediaSource="url"
                          s3Key=""
                          onFileUpload={async (file, folder) => {
                            try {
                              const result = await uploadFile(file, folder);
                              if (result.success && result.data?.url) {
                                if (!editingPartnerCollege) return result.data.url;
                                const newStudents = [...editingPartnerCollege.coursesEnrollment.students];
                                newStudents[index].image = result.data.url;
                                setEditingPartnerCollege({
                                  ...editingPartnerCollege,
                                  coursesEnrollment: {
                                    ...editingPartnerCollege.coursesEnrollment,
                                    students: newStudents,
                                  },
                                });
                                return result.data.url;
                              }
                              throw new Error(result.error || "Upload failed");
                            } catch (err) {
                              throw err;
                            }
                          }}
                          onFileRemove={async () => {
                            if (!editingPartnerCollege) return;
                            const newStudents = [...editingPartnerCollege.coursesEnrollment.students];
                            newStudents[index].image = "";
                            setEditingPartnerCollege({
                              ...editingPartnerCollege,
                              coursesEnrollment: {
                                ...editingPartnerCollege.coursesEnrollment,
                                students: newStudents,
                              },
                            });
                          }}
                          allowUrlInput={true}
                          showConfirmation={false}
                          maxSize={10}
                          acceptedFormats={IMAGE_UPLOAD_FORMATS}
                          isUploading={isUploading}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditCoursesStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0 mt-6 cursor-pointer"
                        title="Remove student"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <WhiteButton
                    type="button"
                    glow={false}
                    className="flex items-center gap-2"
                    onClick={addEditCoursesStudent}
                  >
                    <Plus className="size-4" />
                    Add student
                  </WhiteButton>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <WhiteButton
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                  glow={false}
                >
                  Cancel
                </WhiteButton>
                <OrangeButton
                  onClick={handleUpdate}
                  disabled={updating || isUploading}
                  className="flex-1"
                  glow={false}
                >
                  {updating ? "Updating..." : "Update"}
                </OrangeButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Screen9;
