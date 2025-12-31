"use client";

import React from "react";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import Select, { SelectOption } from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { UserCheck, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "react-toastify";

// Validation Schema
const enrollFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  dob: z.date({ error: "Date of birth is required" }),
  gender: z.string().min(1, "Please select your gender"),
  experience: z.string().min(1, "Please choose your experience"),
  university: z.string().min(1, "Please choose your university"),
  country: z.string().min(1, "Please choose your country"),
  courseName: z.string().min(1, "Please choose your course"),
  yearOfPassing: z.string().min(1, "Please choose your passing year"),
  linkedinUrl: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Please enter a valid LinkedIn URL",
  }),
  instagramUrl: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Please enter a valid Instagram URL",
  }),
  collegeEmail: z.string().email("Please enter a valid email address"),
  guardianContact: z.string().regex(/^\d{10}$/, "Guardian contact must be exactly 10 digits"),
  joinReason: z.string().min(1, "Please choose your reason"),
  crName: z.string().min(1, "CR name is required"),
  crContact: z.string().regex(/^\d{10}$/, "CR contact must be exactly 10 digits"),
  paidTraining: z.string().min(1, "Please choose an option"),
  whatsappJoined: z.string().min(1, "Please choose an option"),
  internshipName: z.string().min(1, "Please choose internship/training name"),
  internshipDuration: z.string().min(1, "Please choose duration"),
  internshipType: z.string().min(1, "Please choose internship type"),
  referralSource: z.string().min(1, "Please choose an option"),
  referralCode: z.string().optional(),
  socialMediaFollowed: z.string().min(1, "Please choose an option"),
  marks10thType: z.string().min(1, "Please choose marks type"),
  marks10thValue: z.string().min(1, "Please enter your 10th marks"),
  marks12thType: z.string().min(1, "Please choose marks type"),
  marks12thValue: z.string().min(1, "Please enter your 12th marks"),
  marksPursuingType: z.string().min(1, "Please choose marks type"),
  marksPursuingValue: z.string().min(1, "Please enter your pursuing course marks"),
  marketingActivities: z.string().min(1, "Please choose an option"),
});

type EnrollFormData = z.infer<typeof enrollFormSchema>;

// Options
const genderOptions: SelectOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const experienceOptions: SelectOption[] = [
  { value: "student-1", label: "College Student - 1st Year" },
  { value: "student-2", label: "College Student - 2nd Year" },
  { value: "student-3", label: "College Student - 3rd Year" },
  { value: "student-4", label: "College Student - 4th Year" },
  { value: "fresh-grad", label: "Fresh Graduate" },
  { value: "professional-tech", label: "Working Professional - Tech" },
  { value: "professional-non-tech", label: "Working Professional - Non-Tech" },
];

const countryOptions: SelectOption[] = [
  { value: "india", label: "India" },
  { value: "usa", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

const courseOptions: SelectOption[] = [
  { value: "data-analytics-ai-ml", label: "Data Analytics (AI & ML)" },
  { value: "data-analytics-sas-python", label: "Data Analytics (SAS & Python)" },
  { value: "data-analytics-tableau-powerbi", label: "Data Analytics (Tableau & Power BI)" },
  { value: "data-analytics-excel-sql", label: "Data Analytics (Excel & SQL)" },
];

const graduationYears: SelectOption[] = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

const joinReasonOptions: SelectOption[] = [
  { value: "skill-development", label: "Skill Development" },
  { value: "career-change", label: "Career Change" },
  { value: "job-placement", label: "Job Placement" },
  { value: "learning", label: "Learning New Technologies" },
  { value: "other", label: "Other" },
];

const yesNoOptions: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const internshipDurationOptions: SelectOption[] = [
  { value: "1-month", label: "1 Month" },
  { value: "2-months", label: "2 Months" },
  { value: "3-months", label: "3 Months" },
  { value: "6-months", label: "6 Months" },
  { value: "1-year", label: "1 Year" },
];

const internshipTypeOptions: SelectOption[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const referralSourceOptions: SelectOption[] = [
  { value: "social-media", label: "Social Media" },
  { value: "friend", label: "Friend/Relative" },
  { value: "college", label: "College" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

const marksTypeOptions: SelectOption[] = [
  { value: "cgpa", label: "CGPA" },
  { value: "percentage", label: "%" },
];

const internshipNameOptions: SelectOption[] = [
  { value: "data-analytics", label: "Data Analytics" },
];

const EnrollForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollFormSchema),
    defaultValues: {
      internshipName: "data-analytics",
      linkedinUrl: "",
      instagramUrl: "",
      referralCode: "",
    },
  });

  const onSubmit = async (data: EnrollFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Enrollment data:", data);
      toast.success("Enrollment form submitted successfully!");
      // You can redirect or show success message here
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit enrollment form. Please try again.");
    }
  };

  const whatsappLink = "https://chat.whatsapp.com/IszV9Kk5k2A5SnwyrhIMMV";

  return (
    <Container
      icon={UserCheck}
      title="Enrollment Form"
      description="Please fill in your details to start your journey with us"
      className="bg-white shadow-xl rounded-3xl overflow-visible border border-gray-100"
      classNameBody="p-4 sm:p-6 md:p-10 overflow-visible"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
        {/* Basic Information Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              required
              {...register("fullName")}
              error={errors.fullName?.message}
            />

            <Input
              label="Email ID"
              type="email"
              placeholder="Enter your email address"
              required
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="Enter your phone number"
              required
              {...register("phone")}
              error={errors.phone?.message}
            />

            <DateSelector
              label="Date of Birth"
              value={watch("dob")}
              onChange={(date) => setValue("dob", date as Date, { shouldValidate: true })}
              placeholder="mm/dd/yyyy"
              required
              error={errors.dob?.message}
            />

            <Select
              label="Gender"
              options={genderOptions}
              value={watch("gender")}
              onChange={(value) => setValue("gender", value, { shouldValidate: true })}
              placeholder="Choose Your Gender"
              required
              error={errors.gender?.message}
            />

            <Select
              label="Experience"
              options={experienceOptions}
              value={watch("experience")}
              onChange={(value) => setValue("experience", value, { shouldValidate: true })}
              placeholder="Choose Your Experience"
              required
              error={errors.experience?.message}
            />
          </div>
        </div>

        {/* Education Information Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Education Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <CollegeSelect
              label="University Name"
              value={watch("university")}
              onChange={(value) => setValue("university", value, { shouldValidate: true })}
              placeholder="Choose Your University"
              required
              error={errors.university?.message}
            />

            <Select
              label="Country"
              options={countryOptions}
              value={watch("country")}
              onChange={(value) => setValue("country", value, { shouldValidate: true })}
              placeholder="Choose Your Country"
              required
              error={errors.country?.message}
            />

            <Select
              label="Course Name"
              options={courseOptions}
              value={watch("courseName")}
              onChange={(value) => setValue("courseName", value, { shouldValidate: true })}
              placeholder="Choose Your Course"
              required
              error={errors.courseName?.message}
            />

            <Select
              label="Year of Passing (Course)"
              options={graduationYears}
              value={watch("yearOfPassing")}
              onChange={(value) => setValue("yearOfPassing", value, { shouldValidate: true })}
              placeholder="Choose Your Passing Year"
              required
              error={errors.yearOfPassing?.message}
            />
          </div>
        </div>

        {/* Contact & Social Media Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Contact & Social Media</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Input
              label="LinkedIn Profile URL (Paste the Profile Link)"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              {...register("linkedinUrl")}
              error={errors.linkedinUrl?.message}
            />

            <Input
              label="Instagram Profile URL (Paste the Profile Link)"
              type="url"
              placeholder="https://instagram.com/yourprofile"
              {...register("instagramUrl")}
              error={errors.instagramUrl?.message}
            />

            <Input
              label="Email ID of College Training and Placement Cell"
              type="email"
              placeholder="tpc@college.edu"
              required
              {...register("collegeEmail")}
              error={errors.collegeEmail?.message}
            />

            <Input
              label="Guardians Contact Number (WhatsApp Enabled)"
              type="tel"
              placeholder="Enter guardian's phone number"
              required
              {...register("guardianContact")}
              error={errors.guardianContact?.message}
            />
          </div>
        </div>

        {/* Internship Details Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Internship Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Select
              label="Why do you want to join this Internship Program?"
              options={joinReasonOptions}
              value={watch("joinReason")}
              onChange={(value) => setValue("joinReason", value, { shouldValidate: true })}
              placeholder="Choose Your Reason"
              required
              error={errors.joinReason?.message}
            />

            <Select
              label="Internship / Training Name"
              options={internshipNameOptions}
              value={watch("internshipName")}
              onChange={(value) => setValue("internshipName", value, { shouldValidate: true })}
              placeholder="Choose Internship/Training Name"
              required
              error={errors.internshipName?.message}
            />

            <Select
              label="Internship / Training Duration"
              options={internshipDurationOptions}
              value={watch("internshipDuration")}
              onChange={(value) => setValue("internshipDuration", value, { shouldValidate: true })}
              placeholder="Choose Duration"
              required
              error={errors.internshipDuration?.message}
            />

            <Select
              label="Internship/Training type"
              options={internshipTypeOptions}
              value={watch("internshipType")}
              onChange={(value) => setValue("internshipType", value, { shouldValidate: true })}
              placeholder="Choose Internship Type"
              required
              error={errors.internshipType?.message}
            />
          </div>
        </div>

        {/* Class Representative Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Class Representative Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Input
              label="CR Name"
              placeholder="Class Representative Name"
              required
              {...register("crName")}
              error={errors.crName?.message}
            />

            <Input
              label="CR Contact No."
              type="tel"
              placeholder="Class Representative Phone Number"
              required
              {...register("crContact")}
              error={errors.crContact?.message}
            />
          </div>
        </div>

        {/* Training Preference Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Select
              label="Do you want a formal paid training to increase your chances for job?"
              options={yesNoOptions}
              value={watch("paidTraining")}
              onChange={(value) => setValue("paidTraining", value, { shouldValidate: true })}
              placeholder="Choose Your Option"
              required
              error={errors.paidTraining?.message}
            />
          </div>
        </div>

        {/* WhatsApp Group Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Join the WhatsApp group from below link as it is MANDATORY to join the WhatsApp group for successful submission.</strong> HR/Admin will contact you in the group.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              Link to WhatsApp group
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <Select
            label="Have you joined?"
            options={yesNoOptions}
            value={watch("whatsappJoined")}
            onChange={(value) => setValue("whatsappJoined", value, { shouldValidate: true })}
            placeholder="Choose Option"
            required
            error={errors.whatsappJoined?.message}
          />
        </div>

        {/* Referral Information Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Referral Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <Select
              label="From where you got to know about us"
              options={referralSourceOptions}
              value={watch("referralSource")}
              onChange={(value) => setValue("referralSource", value, { shouldValidate: true })}
              placeholder="Choose Option"
              required
              error={errors.referralSource?.message}
            />

            <Input
              label="Referral Code (If any)"
              placeholder="Enter referral code"
              {...register("referralCode")}
              error={errors.referralCode?.message}
            />
          </div>

          <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-gray-700 mb-3">
              Follow us on social media to know more about the Internship and Job opportunities.
            </p>
            <p className="text-xs text-gray-600">
              It will increase your chances of selection.
            </p>
          </div>

          <Select
            label="Have you followed now?"
            options={yesNoOptions}
            value={watch("socialMediaFollowed")}
            onChange={(value) => setValue("socialMediaFollowed", value, { shouldValidate: true })}
            placeholder="Choose Option"
            required
            error={errors.socialMediaFollowed?.message}
          />
        </div>

        {/* Academic Marks Section */}
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">Academic Marks</h2>
          
          <div className="space-y-4 md:space-y-6">
            {/* 10th Marks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
              <div className="w-full">
                <Select
                  label="Marks in 10th – CGPA/%"
                  options={marksTypeOptions}
                  value={watch("marks10thType")}
                  onChange={(value) => setValue("marks10thType", value, { shouldValidate: true })}
                  placeholder="Choose Marks Type"
                  required
                  error={errors.marks10thType?.message}
                />
              </div>
              <div className="md:col-span-2 w-full">
                <Input
                  label="10th Marks Value"
                  type="text"
                  placeholder="Enter your 10th marks"
                  required
                  {...register("marks10thValue")}
                  error={errors.marks10thValue?.message}
                />
              </div>
            </div>

            {/* 12th Marks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
              <div className="w-full">
                <Select
                  label="Marks in 12th - CGPA/%"
                  options={marksTypeOptions}
                  value={watch("marks12thType")}
                  onChange={(value) => setValue("marks12thType", value, { shouldValidate: true })}
                  placeholder="Choose Marks Type"
                  required
                  error={errors.marks12thType?.message}
                />
              </div>
              <div className="md:col-span-2 w-full">
                <Input
                  label="12th Marks Value"
                  type="text"
                  placeholder="Enter your 12th marks"
                  required
                  {...register("marks12thValue")}
                  error={errors.marks12thValue?.message}
                />
              </div>
            </div>

            {/* Pursuing Course Marks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
              <div className="w-full">
                <Select
                  label="Marks in Pursuing Course (till date) - CGPA/%"
                  options={marksTypeOptions}
                  value={watch("marksPursuingType")}
                  onChange={(value) => setValue("marksPursuingType", value, { shouldValidate: true })}
                  placeholder="Choose Marks Type"
                  required
                  error={errors.marksPursuingType?.message}
                />
              </div>
              <div className="md:col-span-2 w-full">
                <Input
                  label="Pursuing Course Marks Value"
                  type="text"
                  placeholder="Enter your pursuing course marks"
                  required
                  {...register("marksPursuingValue")}
                  error={errors.marksPursuingValue?.message}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Activities Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="w-full">
            <Select
              label="Do you want to take part in Marketing activities for the brand with some perks?"
              options={yesNoOptions}
              value={watch("marketingActivities")}
              onChange={(value) => setValue("marketingActivities", value, { shouldValidate: true })}
              placeholder="Choose Option"
              required
              error={errors.marketingActivities?.message}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 md:pt-6 flex justify-center">
          <OrangeButton
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto md:px-16 py-4 text-base md:text-lg font-bold"
          >
            {isSubmitting ? "Processing..." : "Enroll Me!"}
          </OrangeButton>
        </div>
      </form>
    </Container>
  );
};

export default EnrollForm;
