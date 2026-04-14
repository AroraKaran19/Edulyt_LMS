"use client";
import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  BriefcaseIcon,
  Users,
  DollarSign,
  Calendar,
  Award,
  Star,
  Building2,
  User,
  MessageSquare,
  Tag,
  Globe,
  Sparkles,
} from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import { useFormContext } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";
import { useInternshipFormContext } from "@/contexts/InternshipFormContext";

const Screen13 = () => {
  const { watch } = useFormContext<InternshipFormData>();
  const { isEditMode } = useInternshipFormContext();

  const formData = watch();
  const [isMounted, setIsMounted] = useState(false);

  useState(() => {
    setIsMounted(true);
  });

  const completionSteps = [
    {
      name: "Basic Information",
      completed: !!(formData.title && formData.description && formData.slug),
    },
    {
      name: "Batches & Pricing",
      completed: formData.batches && formData.batches.length > 0,
    },
    {
      name: "Features & Benefits",
      completed:
        (formData.perks && formData.perks.length > 0) ||
        (formData.features && formData.features.length > 0) ||
        (formData.whyJoin && formData.whyJoin.length > 0),
    },
    {
      name: "Eligibility",
      completed:
        (formData.preRequisites && formData.preRequisites.length > 0) ||
        (formData.whoCanJoin && formData.whoCanJoin.length > 0),
    },
    {
      name: "Journey & Media",
      completed:
        (formData.internshipJourney && formData.internshipJourney.length > 0) ||
        (formData.media && formData.media.length > 0),
    },
    {
      name: "Partner Colleges",
      completed:
        formData.partnerColleges && formData.partnerColleges.length > 0,
    },
    {
      name: "SEO Settings",
      completed: !!(
        formData.slug &&
        formData.metaTitle &&
        formData.metaDescription
      ),
    },
    {
      name: "Testimonials",
      completed: formData.testimonials && formData.testimonials.length > 0,
    },
    {
      name: "Mentors",
      completed: formData.mentors && formData.mentors.length > 0,
    },
  ];

  const completedSteps = completionSteps.filter(
    (step) => step.completed,
  ).length;
  const completionPercentage = Math.round(
    (completedSteps / completionSteps.length) * 100,
  );

  const isReadyToPublish = completedSteps === completionSteps.length;

  if (!isMounted) {
    return (
      <Container
        title="Internship Summary (Screen 13)"
        description="Review your internship details before publishing"
        icon={BriefcaseIcon}
        className="h-full w-full max-h-full overflow-hidden flex flex-col"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading summary...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Internship Summary (Screen 13)"
      description="Review your internship details before publishing"
      icon={BriefcaseIcon}
      className="h-full w-full max-h-full overflow-hidden flex flex-col"
      classNameBody="flex flex-col gap-4"
    >
      <div
        className="flex-1 overflow-y-auto space-y-6 pr-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Completion Status */}
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Completion Status
                </h3>
                <p className="text-sm text-gray-600">
                  {completedSteps} of {completionSteps.length} steps completed
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {completionPercentage}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-linear-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Completion Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completionSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  step.completed
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.completed ? "text-green-800" : "text-gray-600"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          {/* Ready Status */}
          {isReadyToPublish ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="text-green-800 font-semibold">
                    Ready to Publish!
                  </h4>
                  <p className="text-green-700 text-sm">
                    Your internship is complete and ready to be published.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h4 className="text-yellow-800 font-semibold">
                    Almost There!
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Complete the remaining steps to publish your internship.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Basic Information
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Title</label>
              <p className="text-base font-medium text-gray-900">
                {formData.title || "Not set"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Description</label>
              <p className="text-sm text-gray-700 line-clamp-3">
                {formData.description || "Not set"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Audience</label>
                <p className="text-sm text-gray-900">
                  {formData.audience === "college-students"
                    ? "College Students"
                    : "Professionals"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Mode</label>
                <p className="text-sm text-gray-900">
                  {formData.mode || "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Certification</label>
                <p className="text-sm text-gray-900">
                  {formData.certification ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Featured</label>
                <p className="text-sm text-gray-900">
                  {formData.featured ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {formData.thumbnail && (
              <div>
                <label className="text-sm text-gray-600">Thumbnail</label>
                <img
                  src={formData.thumbnail}
                  alt="Internship thumbnail"
                  className="mt-2 w-full max-w-md h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Batches & Pricing */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Batches & Pricing
            </h3>
          </div>

          {formData.batches && formData.batches.length > 0 ? (
            <div className="space-y-4">
              {formData.batches.map((batch, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {batch.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        batch.status === "active"
                          ? "bg-green-100 text-green-700"
                          : batch.status === "inactive"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">
                        Application Deadline:
                      </span>
                      <p className="font-medium">
                        {new Date(
                          batch.applicationLastDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Exam Date:</span>
                      <p className="font-medium">
                        {new Date(batch.examDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium">
                        {new Date(
                          batch.internshipStartDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {batch.plan && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <DollarSign className="w-5 h-5" />₹
                        {batch.plan.price.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No batches added</p>
          )}
        </div>

        {/* Features & Benefits */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Features & Benefits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Award className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Perks</p>
              <p className="text-2xl font-bold text-blue-600">
                {formData.perks?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Star className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Features</p>
              <p className="text-2xl font-bold text-purple-600">
                {formData.features?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Why Join</p>
              <p className="text-2xl font-bold text-green-600">
                {formData.whyJoin?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Partner Colleges & Testimonials */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Social Proof
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-600">Partner Colleges</p>
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                {formData.partnerColleges?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Maximum: 6 colleges</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Testimonials</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formData.testimonials?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Mentors */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Mentors & Instructors
            </h3>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Selected Mentors</p>
            <p className="text-3xl font-bold text-purple-600">
              {formData.mentors?.length || 0}
            </p>
            {formData.mentors && formData.mentors.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                ⚠️ At least one mentor is required
              </p>
            )}
          </div>
        </div>

        {/* SEO Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              SEO & Discoverability
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">URL Slug</label>
              <p className="text-sm font-mono text-blue-600">
                /internships/{formData.slug || "not-set"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Meta Title</label>
              <p className="text-sm text-gray-900">
                {formData.metaTitle || "Not set"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Meta Description</label>
              <p className="text-sm text-gray-700 line-clamp-2">
                {formData.metaDescription || "Not set"}
              </p>
            </div>

            {formData.keywords && formData.keywords.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Note */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isEditMode
                  ? "Update Your Internship"
                  : "Ready to Create Your Internship?"}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isEditMode
                  ? "Click 'Save & Exit' below to update your internship with all the changes you've made."
                  : "Click 'Create Internship' below to publish your internship and make it available to students."}
              </p>

              {!isReadyToPublish && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can still{" "}
                    {isEditMode ? "update" : "create"} the internship, but
                    completing all sections will provide a better experience for
                    students.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Screen13;
