"use client";

import React from "react";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import Select, { SelectOption } from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { UserCheck, ExternalLink, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

// Custom WhatsApp SVG Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

// Custom Telegram SVG Icon
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

// Validation Schema
const enrollFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Phone number must start with 6, 7, 8, or 9",
    }),
  dob: z.date()
    .refine(
      (date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
          return age - 1 >= 13;
        }
        return age >= 13;
      },
      { message: "You must be at least 13 years old" }
    )
    .refine((date) => date <= new Date(), {
      message: "Date of birth cannot be in the future",
    }),
  gender: z.string().min(1, "Please select your gender"),
  experience: z.string().min(1, "Please choose your experience"),
  university: z.string().min(1, "Please choose your university"),
  country: z.string().min(1, "Please choose your country"),
  courseName: z.string().min(1, "Please choose your course"),
  yearOfPassing: z
    .string()
    .min(1, "Please choose your passing year")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 2015 && year <= 2030;
    }, { message: "Please select a valid passing year (2015-2030)" }),
  linkedinUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          const url = new URL(val);
          return url.hostname.includes("linkedin.com");
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)" }
    ),
  instagramUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          const url = new URL(val);
          return url.hostname.includes("instagram.com");
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid Instagram URL (e.g., https://instagram.com/username)" }
    ),
  collegeEmail: z
    .string()
    .min(1, "College email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters"),
  guardianContact: z
    .string()
    .regex(/^\d{10}$/, "Guardian contact must be exactly 10 digits")
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Guardian contact must start with 6, 7, 8, or 9",
    }),
  joinReason: z.string().min(1, "Please choose your reason"),
  crName: z
    .string()
    .min(2, "CR name must be at least 2 characters")
    .max(100, "CR name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "CR name can only contain letters and spaces"),
  crContact: z
    .string()
    .regex(/^\d{10}$/, "CR contact must be exactly 10 digits")
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "CR contact must start with 6, 7, 8, or 9",
    }),
  paidTraining: z.string().min(1, "Please choose an option"),
  whatsappJoined: z.string().min(1, "Please choose an option"),
  internshipName: z
    .string()
    .min(2, "Internship/Training name must be at least 2 characters")
    .max(100, "Internship/Training name must not exceed 100 characters"),
  internshipDuration: z.string().min(1, "Please choose duration"),
  internshipType: z.string().min(1, "Please choose internship type"),
  referralSource: z.string().min(1, "Please choose an option"),
  referralCode: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 50, {
      message: "Referral code must not exceed 50 characters",
    }),
  socialMediaFollowed: z.string().min(1, "Please choose an option"),
  marks10thType: z.string().min(1, "Please choose marks type"),
  marks10thValue: z
    .string()
    .min(1, "Please enter your 10th marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine((val) => {
      const numValue = parseFloat(val);
      return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
    }, { message: "Marks must be between 0 and 100" }),
  marks12thType: z.string().min(1, "Please choose marks type"),
  marks12thValue: z
    .string()
    .min(1, "Please enter your 12th marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine((val) => {
      const numValue = parseFloat(val);
      return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
    }, { message: "Marks must be between 0 and 100" }),
  marksPursuingType: z.string().min(1, "Please choose marks type"),
  marksPursuingValue: z
    .string()
    .min(1, "Please enter your pursuing course marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine((val) => {
      const numValue = parseFloat(val);
      return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
    }, { message: "Marks must be between 0 and 100" }),
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
  { value: "school-student", label: "School Student" },
  { value: "college-student", label: "College Student" },
  { value: "passed-out-unemployed", label: "Passed Out & Unemployed" },
  { value: "0-2-years", label: "0-2 Years" },
  { value: "2-5-years", label: "2-5 Years" },
  { value: "5-10-years", label: "5-10 Years" },
  { value: "10-plus-years", label: "10+ Years" },
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
  { value: "be", label: "BE" },
  { value: "btech", label: "B.Tech" },
  { value: "mtech", label: "M.Tech" },
  { value: "bba", label: "BBA" },
  { value: "mba", label: "MBA" },
  { value: "bca", label: "BCA" },
  { value: "mca", label: "MCA" },
  { value: "bcom", label: "B.COM" },
  { value: "mcom", label: "M.COM" },
  { value: "bsc", label: "B.SC." },
  { value: "msc", label: "M.SC." },
  { value: "ba", label: "BA" },
  { value: "ma", label: "MA" },
  { value: "diploma", label: "Diploma" },
  { value: "others", label: "Others" },
];

const graduationYears: SelectOption[] = Array.from({ length: 16 }, (_, i) => {
  const year = 2015 + i;
  return { value: year.toString(), label: year.toString() };
});

const joinReasonOptions: SelectOption[] = [
  { value: "learn-from-scratch", label: "I want to learn from scratch as I am a beginner." },
  { value: "hands-on-experience", label: "I want hands on experience." },
  { value: "enhance-resume", label: "I need to enhance my resume by adding certificates and projects." },
  { value: "submit-certificate", label: "I need to submit Internship certificate in my college." },
  { value: "major-minor-projects", label: "I want major/minor projects to submit in college." },
  { value: "placement-assistance", label: "I am looking for Placement Assistance." },
  { value: "certified-by-mnc", label: "I want to get certified by MNC" },
  { value: "other", label: "Other" },
];

const yesNoOptions: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const whatsappJoinedOptions: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "having-trouble", label: "Having trouble joining (need help)" },
];

const internshipDurationOptions: SelectOption[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

const internshipTypeOptions: SelectOption[] = [
  { value: "internship-virtual", label: "Internship - Virtual (No classes)" },
  { value: "internship-live", label: "Internship - Live (Online or Offline - Both with regular classes)" },
  { value: "summer-training", label: "Summer Training (Online)" },
];

const referralSourceOptions: SelectOption[] = [
  { value: "college", label: "College" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "others", label: "Others" },
];

const marksTypeOptions: SelectOption[] = [
  { value: "cgpa", label: "CGPA" },
  { value: "percentage", label: "%" },
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
      internshipName: "",
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

  const socialMediaLinks = [
    {
      label: "WhatsApp",
      href: "https://www.whatsapp.com/channel/0029VaIBXP347XeJjHqbNi1X",
      icon: WhatsAppIcon,
      color: "text-green-500 hover:text-green-600",
      bgColor: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Telegram",
      href: "https://t.me/+_XxzFosKYOg2M2I9",
      icon: TelegramIcon,
      color: "text-blue-500 hover:text-blue-600",
      bgColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/edulyt_india/",
      icon: Instagram,
      color: "text-pink-500 hover:text-pink-600",
      bgColor: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/edulytindia/",
      icon: Linkedin,
      color: "text-blue-600 hover:text-blue-700",
      bgColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/people/Edulyt-India/100066801796718/",
      icon: Facebook,
      color: "text-blue-700 hover:text-blue-800",
      bgColor: "bg-blue-700 hover:bg-blue-800",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@EdulytIndia",
      icon: Youtube,
      color: "text-red-500 hover:text-red-600",
      bgColor: "bg-red-500 hover:bg-red-600",
    },
  ];

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

            <Input
              label="Internship / Training Name"
              placeholder="Data Science"
              required
              {...register("internshipName")}
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
            options={whatsappJoinedOptions}
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
            
            {/* Social Media Icons */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {socialMediaLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                      "text-white shadow-md hover:shadow-lg hover:scale-110",
                      social.bgColor
                    )}
                    aria-label={social.label}
                    title={social.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

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
