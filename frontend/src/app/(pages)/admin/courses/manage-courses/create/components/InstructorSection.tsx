"use client";
import React, { useState, useEffect } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { User, Plus, X, Search, UserPlus, Check } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCourseFormContext } from "../context/CourseFormContext";
import { Instructor } from "@/types";
import UploadComponent from "@/components/ui/UploadComponent";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { ENDPOINTS } from "@/constants/endpoints";
import instructorService from "@/services/instructorService";

const InstructorSection = () => {
  const { state, updateField } = useCourseFormContext();

  // Fetch all instructors from API
  const { data: instructorsData, isLoading, error, mutate } = useSWR(ENDPOINTS.instructors.all, fetcher);
  const allInstructors: Instructor[] = instructorsData?.data?.instructors || [];

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor[]>(
    state.instructor || []
  );

  // New instructor form state
  const [newInstructor, setNewInstructor] = useState<Partial<Instructor>>({
    _id: "",
    name: "",
    profileImage: "",
    experience: "",
    rating: 0,
    totalStudents: 0,
    totalCourses: 0,
    bio: "",
    currentPosition: "",
    currentCompany: "",
    previousExperience: [],
    education: [],
    linkedinUrl: "",
  });

  const [newPreviousExp, setNewPreviousExp] = useState("");
  const [newEducation, setNewEducation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  
  // Sync selected instructors with form state
  useEffect(() => {
    updateField('instructor', selectedInstructor);
  }, [selectedInstructor, updateField]);

  // Filter instructors based on search
  const filteredInstructors = allInstructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.currentPosition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected instructor objects
  const selectedInstructors = allInstructors.filter(instructor =>
    selectedInstructor.some(i => i._id === instructor._id)
  );

  // Handle instructor selection
  const toggleInstructorSelection = (instructor: Instructor) => {
    setSelectedInstructor(prev => {
      if (prev.some(i => i._id === instructor._id)) {
        return prev.filter(i => i._id !== instructor._id);
      } else {
        return [...prev, instructor];
      }
    });
  };

  // Handle image upload for new instructor
  const handleInstructorImageUpload = (url: string) => {
    setNewInstructor(prev => ({
      ...prev,
      profileImage: url,
    }));
  };

  // Add previous experience
  const addPreviousExperience = () => {
    if (newPreviousExp.trim()) {
      setNewInstructor(prev => ({
        ...prev,
        previousExperience: [
          ...(prev.previousExperience || []),
          newPreviousExp.trim(),
        ],
      }));
      setNewPreviousExp("");
    }
  };

  // Remove previous experience
  const removePreviousExperience = (index: number) => {
    setNewInstructor(prev => ({
      ...prev,
      previousExperience:
        prev.previousExperience?.filter((_, i) => i !== index) || [],
    }));
  };

  // Add education
  const addEducation = () => {
    if (newEducation.trim()) {
      setNewInstructor(prev => ({
        ...prev,
        education: [...(prev.education || []), newEducation.trim()],
      }));
      setNewEducation("");
    }
  };

  // Remove education
  const removeEducation = (index: number) => {
    setNewInstructor(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || [],
    }));
  };

  // Handle adding new instructor
  const handleAddNewInstructor = async () => {
    if (!newInstructor.name || !newInstructor.bio || !newInstructor.linkedinUrl || !newInstructor.experience) {
      setCreateError("Please fill in all required fields (Name, Experience, Bio, and LinkedIn URL are required)");
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const instructorData = {
        name: newInstructor.name.trim(),
        bio: newInstructor.bio.trim(),
        linkedinUrl: newInstructor.linkedinUrl.trim(),
        experience: newInstructor.experience.trim(),
        currentPosition: newInstructor.currentPosition?.trim() || "",
        currentCompany: newInstructor.currentCompany?.trim() || "",
        profileImage: newInstructor.profileImage || "",
        rating: newInstructor.rating || 0,
        totalStudents: newInstructor.totalStudents || 0,
        totalCourses: newInstructor.totalCourses || 0,
        previousExperience: newInstructor.previousExperience || [],
        education: newInstructor.education || [],
      };

      const response = await instructorService.createInstructor(instructorData);

      if (response.success) {
        setCreateSuccess("Instructor created successfully!");
        
        // Reset form
        setNewInstructor({
          _id: "",
          name: "",
          profileImage: "",
          experience: "",
          rating: 0,
          totalStudents: 0,
          totalCourses: 0,
          bio: "",
          currentPosition: "",
          currentCompany: "",
          previousExperience: [],
          education: [],
          linkedinUrl: "",
        });
        
        // Clear arrays
        setNewPreviousExp("");
        setNewEducation("");
        
        // Refresh the instructors list
        await mutate();
        
        // Hide form after a short delay to show success message
        setTimeout(() => {
          setShowAddForm(false);
          setCreateSuccess(null);
        }, 2000);
      } else {
        setCreateError(response.message || "Failed to create instructor");
      }
    } catch (error) {
      console.error('Error creating instructor:', error);
      setCreateError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = newInstructor.name && newInstructor.bio && newInstructor.linkedinUrl && newInstructor.experience && !isCreating;

  if (isLoading) {
    return (
      <Container
        id="instructors"
        icon={User}
        title="Course Instructors"
        description="Add and manage course instructors"
      >
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading instructors...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        id="instructors"
        icon={User}
        title="Course Instructors"
        description="Add and manage course instructors"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading instructors. Please try again.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container
      id="instructors"
      icon={User}
      title="Course Instructors"
      description="Select instructors for your course or add new ones"
    >
      <div className="w-full space-y-6">
        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <input
              type="text"
              placeholder="Search instructors by name, position, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>
                     <button
             type="button"
             onClick={() => {
               setShowAddForm(!showAddForm);
               if (!showAddForm) {
                 // Clear any existing errors/success when opening form
                 setCreateError(null);
                 setCreateSuccess(null);
               }
             }}
             className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
           >
             <UserPlus className="size-4" />
             {showAddForm ? 'Cancel' : 'Add New Instructor'}
           </button>
        </div>

        {/* Selected Instructors Summary */}
        {selectedInstructors.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">
              Selected Instructors ({selectedInstructors.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedInstructors.map(instructor => (
                <div
                  key={instructor._id}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {instructor.profileImage && (
                    <Image
                      src={instructor.profileImage}
                      alt={instructor.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  {instructor.name}
                  <button
                    type="button"
                    onClick={() => toggleInstructorSelection(instructor)}
                    className="text-green-600 hover:text-green-800 ml-1"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

                 {/* Add New Instructor Form */}
         {showAddForm && (
           <div className="bg-gray-50 p-6 rounded-lg space-y-6 border-2 border-dashed border-gray-300">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-800">Add New Instructor</h3>
               <div className="flex items-center gap-3">
                 {isCreating && (
                   <div className="flex items-center gap-2 text-sm text-blue-600">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                     Creating...
                   </div>
                 )}
                 <p className="text-xs text-gray-500">
                   <span className="text-red-500">*</span> Required fields
                 </p>
               </div>
             </div>

             {/* Success Message */}
             {createSuccess && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <p className="text-green-700 text-sm font-medium">{createSuccess}</p>
               </div>
             )}

             {/* Error Message */}
             {createError && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <p className="text-red-700 text-sm font-medium">{createError}</p>
               </div>
             )}

            {/* Profile Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Profile Image
              </label>
              <UploadComponent
                onUploadComplete={handleInstructorImageUpload}
                acceptedFileTypes={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
                uploadType="instructor-image"
                maxFileSize={50 * 1024 * 1024} // 50MB 
                placeholder="Upload instructor profile image"
                currentUrl={newInstructor.profileImage}
              />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Instructor's full name"
                  value={newInstructor.name}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Current Position
                </label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  value={newInstructor.currentPosition}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, currentPosition: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Current Company
                </label>
                <input
                  type="text"
                  placeholder="e.g., Google, Microsoft, Meta"
                  value={newInstructor.currentCompany}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, currentCompany: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="4.8"
                  value={newInstructor.rating}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Total Students</label>
                <input
                  type="number"
                  min="0"
                  placeholder="1000"
                  value={newInstructor.totalStudents}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, totalStudents: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Total Courses</label>
                <input
                  type="number"
                  min="0"
                  placeholder="15"
                  value={newInstructor.totalCourses}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, totalCourses: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Write a brief bio about the instructor..."
                value={newInstructor.bio}
                onChange={(e) => setNewInstructor(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
              />
            </div>

                         {/* Experience */}
             <div className="space-y-2">
               <label className="block text-sm font-medium text-gray-700">
                 Experience Summary <span className="text-red-500">*</span>
               </label>
               <textarea
                 placeholder="Brief summary of instructor's experience..."
                 value={newInstructor.experience}
                 onChange={(e) => setNewInstructor(prev => ({ ...prev, experience: e.target.value }))}
                 rows={2}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
               />
             </div>

            {/* Previous Experience */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Previous Experience</label>
              <FlexBox className="w-full gap-2">
                <input
                  type="text"
                  placeholder="Add previous work experience"
                  value={newPreviousExp}
                  onChange={(e) => setNewPreviousExp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPreviousExperience())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={addPreviousExperience}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <Plus className="size-4" />
                </button>
              </FlexBox>
              {newInstructor.previousExperience && newInstructor.previousExperience.length > 0 && (
                <div className="space-y-2 mt-2">
                  {newInstructor.previousExperience.map((exp, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-gray-700">{exp}</span>
                      <button
                        type="button"
                        onClick={() => removePreviousExperience(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <FlexBox className="w-full gap-2">
                <input
                  type="text"
                  placeholder="Add education qualification"
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEducation())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={addEducation}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <Plus className="size-4" />
                </button>
              </FlexBox>
              {newInstructor.education && newInstructor.education.length > 0 && (
                <div className="space-y-2 mt-2">
                  {newInstructor.education.map((edu, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-gray-700">{edu}</span>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                LinkedIn URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Image
                  src="/linkedin-icon.svg"
                  className="size-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                />
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={newInstructor.linkedinUrl}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
            </div>

                         {/* Add Button */}
             <button
               type="button"
               onClick={handleAddNewInstructor}
               disabled={!isFormValid}
               className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
             >
               {isCreating ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   Creating...
                 </>
               ) : (
                 "Add New Instructor"
               )}
             </button>
          </div>
        )}

        {/* Available Instructors */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">
            Available Instructors ({filteredInstructors.length})
          </h3>
          
          {filteredInstructors.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <User className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No instructors found matching your search.' : 'No instructors available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInstructors.map((instructor) => {
                const isSelected = selectedInstructor.some(i => i._id === instructor._id);
                return (
                  <div
                    key={instructor._id}
                    className={cn(
                      "bg-white border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                      isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:shadow-md"
                    )}
                    onClick={() => toggleInstructorSelection(instructor)}
                  >
                    <div className="flex items-start gap-4">
                      {instructor.profileImage && (
                        <Image
                          src={instructor.profileImage}
                          alt={instructor.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                              {instructor.name}
                              {isSelected && (
                                <Check className="size-5 text-orange-500" />
                              )}
                            </h4>
                            {(instructor.currentPosition || instructor.currentCompany) && (
                              <p className="text-sm text-gray-600 mt-1">
                                {instructor.currentPosition && instructor.currentCompany
                                  ? `${instructor.currentPosition} at ${instructor.currentCompany}`
                                  : instructor.currentPosition || instructor.currentCompany
                                }
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>⭐ {instructor.rating}/5</span>
                              <span>👥 {instructor.totalStudents} students</span>
                              <span>📚 {instructor.totalCourses} courses</span>
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            isSelected
                              ? "bg-orange-500 border-orange-500"
                              : "border-gray-300"
                          )}>
                            {isSelected && <Check className="size-4 text-white" />}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-3 line-clamp-2">
                          {instructor.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default InstructorSection;
