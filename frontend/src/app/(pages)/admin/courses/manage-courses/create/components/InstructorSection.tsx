"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { User, Plus, X, Upload, Linkedin } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCourseFormContext } from "../context/CourseFormContext";
import { Instructor } from "@/types/course";
import UploadComponent from "@/components/ui/UploadComponent";

const InstructorSection = () => {
  const {
    state,
    addInstructor,
    removeInstructor,
    updateArrayItem,
  } = useCourseFormContext();

  const [newInstructor, setNewInstructor] = useState<Partial<Instructor>>({
    _id: '',
    name: '',
    profileImage: '',
    experience: '',
    rating: 0,
    totalStudents: 0,
    totalCourses: 0,
    bio: '',
    currentPosition: '',
    previousExperience: [],
    education: [],
    linkedinUrl: '',
  });

  const [newPreviousExp, setNewPreviousExp] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // This is now handled by the UploadComponent
  };

    const handleInstructorImageUpload = (url: string, fileName: string) => {
    setNewInstructor(prev => ({ 
      ...prev, 
      profileImage: url 
    }));
  };

  const addPreviousExperience = () => {
    if (newPreviousExp.trim()) {
      setNewInstructor(prev => ({
        ...prev,
        previousExperience: [...(prev.previousExperience || []), newPreviousExp.trim()]
      }));
      setNewPreviousExp('');
    }
  };

  const removePreviousExperience = (index: number) => {
    setNewInstructor(prev => ({
      ...prev,
      previousExperience: prev.previousExperience?.filter((_, i) => i !== index) || []
    }));
  };

  const addEducation = () => {
    if (newEducation.trim()) {
      setNewInstructor(prev => ({
        ...prev,
        education: [...(prev.education || []), newEducation.trim()]
      }));
      setNewEducation('');
    }
  };

  const removeEducation = (index: number) => {
    setNewInstructor(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddInstructor = () => {
    if (newInstructor.name && newInstructor.bio && newInstructor.linkedinUrl) {
      const instructorToAdd: Instructor = {
        _id: Date.now().toString(),
        name: newInstructor.name!,
        profileImage: newInstructor.profileImage || '',
        experience: newInstructor.experience || '',
        rating: Number(newInstructor.rating) || 0,
        totalStudents: Number(newInstructor.totalStudents) || 0,
        totalCourses: Number(newInstructor.totalCourses) || 0,
        bio: newInstructor.bio!,
        currentPosition: newInstructor.currentPosition || '',
        previousExperience: newInstructor.previousExperience || [],
        education: newInstructor.education || [],
        linkedinUrl: newInstructor.linkedinUrl!,
      };

      if (editingIndex !== null) {
        updateArrayItem('instructor', editingIndex, instructorToAdd);
        setEditingIndex(null);
      } else {
        addInstructor(instructorToAdd);
      }

      // Reset form
      setNewInstructor({
        _id: '',
        name: '',
        profileImage: '',
        experience: '',
        rating: 0,
        totalStudents: 0,
        totalCourses: 0,
        bio: '',
        currentPosition: '',
        previousExperience: [],
        education: [],
        linkedinUrl: '',
      });
    }
  };

  const handleEditInstructor = (index: number) => {
    const instructor = state.instructor[index];
    setNewInstructor(instructor);
    setEditingIndex(index);
  };

  const cancelEdit = () => {
    setNewInstructor({
      _id: '',
      name: '',
      profileImage: '',
      experience: '',
      rating: 0,
      totalStudents: 0,
      totalCourses: 0,
      bio: '',
      currentPosition: '',
      previousExperience: [],
      education: [],
      linkedinUrl: '',
    });
    setEditingIndex(null);
  };

  const isFormValid = newInstructor.name && newInstructor.bio && newInstructor.linkedinUrl;

  return (
    <Container
      id="instructors"
      icon={User}
      title="Course Instructors"
      description="Add and manage course instructors"
    >
      <div className="w-full space-y-6">
        {/* Instructor Form */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              {editingIndex !== null ? 'Edit Instructor' : 'Add New Instructor'}
            </h3>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Profile Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Profile Image
            </label>
            <UploadComponent
              onUploadComplete={handleInstructorImageUpload}
              acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              uploadType="instructor-image"
              maxFileSize={5 * 1024 * 1024} // 5MB
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
                placeholder="e.g., Senior Software Engineer at Google"
                value={newInstructor.currentPosition}
                onChange={(e) => setNewInstructor(prev => ({ ...prev, currentPosition: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rating (1-5)
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Total Students
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Total Courses
              </label>
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
              Experience Summary
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
            <label className="block text-sm font-medium text-gray-700">
              Previous Experience
            </label>
            <FlexBox className="w-full gap-2">
              <input
                type="text"
                placeholder="Add previous work experience"
                value={newPreviousExp}
                onChange={(e) => setNewPreviousExp(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addPreviousExperience())
                }
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
            <label className="block text-sm font-medium text-gray-700">
              Education
            </label>
            <FlexBox className="w-full gap-2">
              <input
                type="text"
                placeholder="Add education qualification"
                value={newEducation}
                onChange={(e) => setNewEducation(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addEducation())
                }
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
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
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
            onClick={handleAddInstructor}
            disabled={!isFormValid}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {editingIndex !== null ? 'Update Instructor' : 'Add Instructor'}
          </button>
        </div>

        {/* Instructors List */}
        {state.instructor.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Course Instructors</h3>
            <div className="grid grid-cols-1 gap-4">
              {state.instructor.map((instructor, index) => (
                <div key={instructor._id} className="bg-white border border-gray-200 rounded-lg p-6">
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
                          <h4 className="text-lg font-medium text-gray-800">{instructor.name}</h4>
                          {instructor.currentPosition && (
                            <p className="text-sm text-gray-600 mt-1">{instructor.currentPosition}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>⭐ {instructor.rating}/5</span>
                            <span>👥 {instructor.totalStudents} students</span>
                            <span>📚 {instructor.totalCourses} courses</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditInstructor(index)}
                            className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInstructor(index)}
                            className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{instructor.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default InstructorSection; 