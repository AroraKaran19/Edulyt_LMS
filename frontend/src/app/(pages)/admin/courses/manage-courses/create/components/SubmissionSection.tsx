"use client";
import React, { useState } from 'react';
import { Save, Send, AlertCircle, CheckCircle, Loader2, Eye } from 'lucide-react';
import { useCourseFormContext } from '../context/CourseFormContext';
import courseService from '@/services/courseService';
import { useRouter } from 'next/navigation';

const SubmissionSection = () => {
  const { state, resetForm, isBasicInfoValid } = useCourseFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  const validateAndShowErrors = () => {
    const validation = courseService.validateCourseData(state);
    setValidationErrors(validation.errors);
    return validation.valid;
  };

  const handleSubmit = async () => {
    // Clear previous messages
    setSubmitMessage(null);
    setValidationErrors([]);

    // Validate form data
    if (!validateAndShowErrors()) {
      setSubmitMessage({
        type: 'error',
        message: 'Please fix the validation errors before submitting.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform form data to backend format
      const transformedData = courseService.transformFormDataToBackend(state);
      
      // Submit to backend
      const result = await courseService.createCourse(transformedData);

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: 'Course created successfully!'
        });

        // Clear the form
        resetForm();

        // Redirect to course management page after 2 seconds
        setTimeout(() => {
          router.push('/admin/courses/manage-courses');
        }, 2000);
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.message || 'Failed to create course. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting course:', error);
      setSubmitMessage({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setSubmitMessage(null);

    try {
      const result = await courseService.saveDraft(state);
      
      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: 'Draft saved successfully!'
        });
      } else {
        setSubmitMessage({
          type: 'error',
          message: 'Failed to save draft. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setSubmitMessage({
        type: 'error',
        message: 'An unexpected error occurred while saving draft.'
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePreview = () => {
    // For now, just log the course data
    // In future, this could open a preview modal or navigate to preview page
    console.log('Course Preview Data:', state);
    alert('Preview functionality will be implemented soon. Check console for course data.');
  };

  const getFormCompletionPercentage = () => {
    const requiredFields = [
      state.title,
      state.description,
      state.category,
      state.thumbnail,
      state.skillLevel,
      state.audience,
      state.instructor?.length > 0
    ];

    const completedFields = requiredFields.filter(field => 
      typeof field === 'boolean' ? field : Boolean(field)
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const completionPercentage = getFormCompletionPercentage();
  const canSubmit = isBasicInfoValid() && state.instructor?.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Send className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Submit Course</h3>
          <p className="text-sm text-gray-600">Review and publish your course</p>
        </div>
      </div>

      {/* Form Completion Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm text-gray-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submit Message */}
      {submitMessage && (
        <div className={`mb-6 p-4 border rounded-lg ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {submitMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {submitMessage.message}
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Modules</p>
          <p className="text-lg font-semibold text-gray-900">{state.modules?.length || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Instructors</p>
          <p className="text-lg font-semibold text-gray-900">{state.instructor?.length || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">FAQs</p>
          <p className="text-lg font-semibold text-gray-900">{state.faqs?.length || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Plans</p>
          <p className="text-lg font-semibold text-gray-900">
            {(state.plans?.elite?.length || 0) + (state.plans?.essential?.length || 0)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Preview Button */}
        <button
          type="button"
          onClick={handlePreview}
          disabled={isSubmitting || isSavingDraft}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting || isSavingDraft}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingDraft ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSavingDraft ? 'Saving...' : 'Save Draft'}
        </button>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || isSavingDraft}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSubmitting ? 'Creating Course...' : 'Create Course'}
        </button>
      </div>

      {/* Help Text */}
      {!canSubmit && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Almost there!</strong> Complete the required fields to enable course submission:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            {!state.title && <li>• Add course title</li>}
            {!state.description && <li>• Add course description</li>}
            {!state.category && <li>• Select course category</li>}
            {!state.thumbnail && <li>• Upload course thumbnail</li>}
            {!state.skillLevel && <li>• Select skill level</li>}
            {!state.audience && <li>• Select target audience</li>}
            {(!state.instructor || state.instructor.length === 0) && <li>• Add at least one instructor</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SubmissionSection; 