"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { InternshipEnrollPreview } from "@/types";
import apiClient from "@/configs/apiConfig";
import { isApplicationWindowOpenIst } from "@/lib/applicationWindow";
import { useSearchParams, useRouter } from "next/navigation";
import { ENDPOINTS } from "@/constants/endpoints";
import Input from "@/components/ui/inputs/Input";
import Select, { SelectOption } from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import {
  ExternalLink,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Clock,
} from "lucide-react";
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
  dob: z
    .date()
    .refine(
      (date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < date.getDate())
        ) {
          return age - 1 >= 13;
        }
        return age >= 13;
      },
      { message: "You must be at least 13 years old" },
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
    .refine(
      (val) => {
        const year = parseInt(val);
        return year >= 2015 && year <= 2030;
      },
      { message: "Please select a valid passing year (2015-2030)" },
    ),
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
      {
        message:
          "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)",
      },
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
      {
        message:
          "Please enter a valid Instagram URL (e.g., https://instagram.com/username)",
      },
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
  joinReason: z
    .string()
    .min(10, "Please describe your reason (at least 10 characters)")
    .max(500, "Please keep it under 500 characters"),
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
  internshipDuration: z.string().min(1, "Please choose duration"),
  referralSource: z.string().min(1, "Please choose an option"),
  socialMediaFollowed: z.string().min(1, "Please choose an option"),
  marks10thType: z.string().min(1, "Please choose marks type"),
  marks10thValue: z
    .string()
    .min(1, "Please enter your 10th marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine(
      (val) => {
        const numValue = parseFloat(val);
        return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
      },
      { message: "Marks must be between 0 and 100" },
    ),
  marks12thType: z.string().min(1, "Please choose marks type"),
  marks12thValue: z
    .string()
    .min(1, "Please enter your 12th marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine(
      (val) => {
        const numValue = parseFloat(val);
        return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
      },
      { message: "Marks must be between 0 and 100" },
    ),
  marksPursuingType: z.string().min(1, "Please choose marks type"),
  marksPursuingValue: z
    .string()
    .min(1, "Please enter your pursuing course marks")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid number")
    .refine(
      (val) => {
        const numValue = parseFloat(val);
        return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
      },
      { message: "Marks must be between 0 and 100" },
    ),
  marketingActivities: z.string().min(1, "Please choose an option"),
  batchId: z.string().min(1, "Please select a batch"),
});

type EnrollFormData = z.infer<typeof enrollFormSchema>;

/** Persist full enroll form as JSON on `InternshipEnrollment.applicationAnswers`. */
function buildApplicationAnswersPayload(data: EnrollFormData): Record<string, unknown> {
  const { dob, ...rest } = data;
  return {
    ...rest,
    dob: dob instanceof Date ? dob.toISOString() : String(dob),
  };
}

function enrollSchemaWithOpenBatches(openIds: Set<string>) {
  return enrollFormSchema.refine((data) => openIds.has(data.batchId), {
    message:
      "This cohort is no longer accepting applications (deadline has passed).",
    path: ["batchId"],
  });
}

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

function formatBatchLabel(
  b: InternshipEnrollPreview["batches"][number],
): string {
  const start = b.internshipStartDate
    ? new Date(b.internshipStartDate).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
        day: "numeric",
      })
    : "";
  const applyBy = b.applicationLastDate
    ? new Date(b.applicationLastDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const base = `${b.name}${start ? ` — starts ${start}` : ""}`;
  return applyBy ? `${base} · apply by ${applyBy}` : base;
}

const EnrollForm = ({ preview }: { preview: InternshipEnrollPreview }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSeatFlow = searchParams.get("flow") === "seat";

  const openBatches = useMemo(
    () =>
      preview.batches.filter((b) =>
        isApplicationWindowOpenIst(b.applicationLastDate),
      ),
    [preview.batches],
  );

  const openBatchIds = useMemo(
    () => new Set(openBatches.map((b) => b._id)),
    [openBatches],
  );

  const resolvedSchema = useMemo(
    () => enrollSchemaWithOpenBatches(openBatchIds),
    [openBatchIds],
  );

  const batchOptions: SelectOption[] = openBatches.map((b) => ({
    value: b._id,
    label: formatBatchLabel(b),
  }));

  const [profileLoading, setProfileLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<EnrollFormData>({
    resolver: zodResolver(resolvedSchema),
    defaultValues: {
      linkedinUrl: "",
      instagramUrl: "",
      batchId: openBatches[0]?._id ?? "",
    },
  });

  const batchId = watch("batchId");
  const selectedBatch = openBatches.find((b) => b._id === batchId);

  // Seed the batch dropdown to the first cohort that is still open for applications.
  useEffect(() => {
    if (openBatches[0]) {
      setValue("batchId", openBatches[0]._id, { shouldValidate: true });
    }
  }, [openBatches, setValue]);

  // Autofill from /users/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/users/me");
        if (cancelled) return;
        const u = res.data?.data as Record<string, unknown> | undefined;
        if (!u) return;

        const firstName = String(u.firstName ?? "").trim();
        const lastName = String(u.lastName ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        if (fullName) setValue("fullName", fullName);

        if (u.email) setValue("email", String(u.email));

        const phone = String(u.phone ?? "")
          .replace(/\D/g, "")
          .slice(-10);
        if (phone.length === 10) setValue("phone", phone);

        if (u.dob) {
          const d = new Date(u.dob as string);
          if (!Number.isNaN(d.getTime())) setValue("dob", d);
        }

        const gender = u.gender as string | undefined;
        if (gender) setValue("gender", gender);

        const linkedin = (u.accounts as Record<string, unknown> | undefined)
          ?.linkedin;
        const linkedinUrl =
          typeof linkedin === "object" && linkedin !== null
            ? ((linkedin as Record<string, unknown>).url as string | undefined)
            : undefined;
        if (linkedinUrl) setValue("linkedinUrl", linkedinUrl);

        const instagram = (u.accounts as Record<string, unknown> | undefined)
          ?.instagram;
        if (typeof instagram === "string" && instagram)
          setValue("instagramUrl", instagram);
      } catch {
        // Non-critical; user fills manually.
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const onSubmit = async (data: EnrollFormData) => {
    try {
      // Split full name back into first/last
      const [firstName, ...rest] = data.fullName.trim().split(" ");
      const lastName = rest.join(" ") || undefined;

      // 1. Update the user's profile with form data
      await apiClient.put("/users/me", {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        dob: data.dob.toISOString(),
        gender: data.gender,
      });

      const applicationAnswers = buildApplicationAnswersPayload(data);

      if (isSeatFlow) {
        // ── Paid-seat path ────────────────────────────────────────────────────
        // 2a. Create a payment_pending enrollment
        const enrollRes = await apiClient.post(
          ENDPOINTS.internshipEnrollments.create,
          {
            internshipId: preview.internship._id,
            batchId: data.batchId,
            path: "paid",
            applicationAnswers,
          },
        );
        const enrollmentId = enrollRes.data?.data?.enrollmentId as
          | string
          | undefined;
        if (!enrollmentId) throw new Error("Enrollment creation failed");

        // 2b. Create Paytm order for the seat
        const orderRes = await apiClient.post(
          ENDPOINTS.orders.createInternshipSeat,
          { internshipEnrollmentId: enrollmentId },
        );
        const order = orderRes.data?.data as
          | { _id: string; freeOrder?: boolean; token?: string }
          | undefined;
        if (!order) throw new Error("Order creation failed");

        if (order.freeOrder && order.token) {
          // Batch is free — skip Paytm, go straight to payment status page
          window.location.href = `/payment/status/${order._id}?token=${order.token}`;
          return;
        }

        // Redirect to Paytm checkout
        window.location.href = `/paytm-redirect?orderId=${order._id}`;
      } else {
        // ── Entrance / merit path ─────────────────────────────────────────────
        // 2b. Register the user for the entrance exam
        await apiClient.post(ENDPOINTS.internshipEnrollments.create, {
          internshipId: preview.internship._id,
          batchId: data.batchId,
          applicationAnswers,
        });

        toast.success(
          "You are registered for the entrance exam! We will notify you before the exam date.",
        );
        router.replace("/dashboard");
      }
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to submit. Please try again.";
      toast.error(msg);
    }
  };

  void profileLoading;

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
      bgColor:
        "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90",
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

  if (openBatches.length === 0) {
    return (
      <div className="rounded-sm border border-stone-200 bg-[#fffdf9] px-6 py-10 text-center shadow-[2px_3px_0_0_rgba(0,0,0,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {preview.internship.title}
        </p>
        <p className="mt-4 text-sm text-stone-600 leading-relaxed">
          No cohort is open for applications at the moment. Check back when a
          new intake is announced.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="mb-8 md:mb-10 border-b border-stone-200/80 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Application
        </p>
        <h1 className="mt-2 text-2xl sm:text-[1.75rem] font-bold text-[#111827] tracking-tight leading-snug">
          {preview.internship.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-stone-600">
          {isSeatFlow ? (
            <>
              You chose the{" "}
              <strong className="font-semibold text-stone-800">
                paid seat
              </strong>{" "}
              path: after this form you&apos;ll pay the cohort fee and your
              place is confirmed. If this batch runs an entrance exam, you can
              still attempt it — it won&apos;t override a completed payment.
            </>
          ) : (
            <>
              You&apos;re applying through the{" "}
              <strong className="font-semibold text-stone-800">
                entrance exam &amp; merit
              </strong>{" "}
              route. Pick your cohort and duration, then share your details —
              we&apos;ll register you for the exam for this intake.
            </>
          )}
        </p>
      </header>

      <div className="rounded-sm border border-stone-200 bg-white shadow-[3px_4px_0_0_rgba(15,23,42,0.06)]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 md:space-y-10 p-5 sm:p-8 md:p-10"
        >
          {/* Cohort, entrance exam preference, program duration */}
          <div className="space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
              01 · Cohort
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
              <Select
                label="Batch (cohort)"
                options={batchOptions}
                value={watch("batchId")}
                onChange={(value) =>
                  setValue("batchId", value, { shouldValidate: true })
                }
                placeholder="Select your batch"
                required
                error={errors.batchId?.message}
              />
              <Select
                label="Internship duration (months)"
                options={internshipDurationOptions}
                value={watch("internshipDuration")}
                onChange={(value) =>
                  setValue("internshipDuration", value, {
                    shouldValidate: true,
                  })
                }
                placeholder="Choose duration"
                required
                error={errors.internshipDuration?.message}
              />
            </div>

            {selectedBatch && (
              <div className="border border-stone-200 bg-stone-50/50 text-[15px] text-stone-800">
                <div className="border-b border-stone-200 bg-white/90 px-4 py-3 sm:px-5">
                  <p className="text-xs font-medium text-stone-500">
                    Last day to apply (India time, end of day counts)
                  </p>
                  <p className="mt-1 font-medium text-stone-900">
                    {selectedBatch.applicationLastDate
                      ? new Date(
                          selectedBatch.applicationLastDate,
                        ).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "long",
                        })
                      : "—"}
                  </p>
                </div>

                <div className="space-y-0">
                  {isSeatFlow && selectedBatch.plan && (
                    <div className="border-b border-stone-200 border-l-4 border-l-primary bg-white px-4 py-4 sm:px-5">
                      <p className="text-xs text-stone-500">
                        Fee for this intake
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <span className="text-2xl sm:text-3xl font-bold tabular-nums text-stone-900">
                          ₹{selectedBatch.plan.amount.toLocaleString("en-IN")}
                        </span>
                        {selectedBatch.plan.amount !==
                          selectedBatch.plan.listPrice && (
                          <span className="text-sm text-stone-400 line-through tabular-nums">
                            ₹
                            {selectedBatch.plan.listPrice.toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                        Charged once you continue — Paytm on the next screen.
                      </p>
                    </div>
                  )}

                  {selectedBatch.entranceExam && (
                    <div>
                      <div className="flex items-center gap-2 border-b border-stone-200 bg-amber-50/60 px-4 py-2.5 sm:px-5">
                        <Clock
                          className="size-4 text-amber-800/70 shrink-0"
                          aria-hidden
                        />
                        <p className="text-sm text-amber-950">
                          <span className="font-semibold">Entrance: </span>
                          {selectedBatch.entranceExam.title}
                          {isSeatFlow && (
                            <span className="text-amber-900/80">
                              {" "}
                              — you can still sit it; your seat follows payment.
                            </span>
                          )}
                        </p>
                      </div>
                      <ul className="divide-y divide-stone-200 bg-white text-sm sm:text-[15px]">
                        {(
                          [
                            {
                              label: "Paper opens",
                              d: selectedBatch.entranceExam.examStartAt,
                            },
                            {
                              label: "Closes",
                              d: selectedBatch.entranceExam.examEndAt,
                            },
                            {
                              label: "Results",
                              d: selectedBatch.entranceExam.examResultAt,
                            },
                          ] as const
                        ).map((row) => (
                          <li
                            key={row.label}
                            className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                          >
                            <span className="shrink-0 text-stone-500">
                              {row.label}
                            </span>
                            <span className="min-w-0 text-right font-medium text-stone-900">
                              {row.d
                                ? new Date(row.d).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "To be announced"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {!isSeatFlow && (
                        <p className="border-t border-stone-200 bg-stone-50/80 px-4 py-2.5 text-xs text-stone-600 sm:px-5">
                          Selection for this cohort uses these dates and your
                          exam performance.
                        </p>
                      )}
                    </div>
                  )}

                  {!isSeatFlow && !selectedBatch.entranceExam && (
                    <p className="px-4 py-3 text-sm text-stone-600 sm:px-5">
                      This intake has no separate entrance test — you&apos;ll
                      hear next steps after we receive this form.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              02 · Basic information
            </h2>

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
                onChange={(date) =>
                  setValue("dob", date as Date, { shouldValidate: true })
                }
                placeholder="mm/dd/yyyy"
                required
                error={errors.dob?.message}
              />

              <Select
                label="Gender"
                options={genderOptions}
                value={watch("gender")}
                onChange={(value) =>
                  setValue("gender", value, { shouldValidate: true })
                }
                placeholder="Choose Your Gender"
                required
                error={errors.gender?.message}
              />

              <Select
                label="Experience"
                options={experienceOptions}
                value={watch("experience")}
                onChange={(value) =>
                  setValue("experience", value, { shouldValidate: true })
                }
                placeholder="Choose Your Experience"
                required
                error={errors.experience?.message}
              />
            </div>
          </div>

          {/* Education Information Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              03 · Education
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
              <CollegeSelect
                label="University Name"
                value={watch("university")}
                onChange={(value) =>
                  setValue("university", value, { shouldValidate: true })
                }
                placeholder="Choose Your University"
                required
                error={errors.university?.message}
              />

              <Select
                label="Country"
                options={countryOptions}
                value={watch("country")}
                onChange={(value) =>
                  setValue("country", value, { shouldValidate: true })
                }
                placeholder="Choose Your Country"
                required
                error={errors.country?.message}
              />

              <Select
                label="Course Name"
                options={courseOptions}
                value={watch("courseName")}
                onChange={(value) =>
                  setValue("courseName", value, { shouldValidate: true })
                }
                placeholder="Choose Your Course"
                required
                error={errors.courseName?.message}
              />

              <Select
                label="Year of Passing (Course)"
                options={graduationYears}
                value={watch("yearOfPassing")}
                onChange={(value) =>
                  setValue("yearOfPassing", value, { shouldValidate: true })
                }
                placeholder="Choose Your Passing Year"
                required
                error={errors.yearOfPassing?.message}
              />
            </div>
          </div>

          {/* Contact & Social Media Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              04 · Contact
            </h2>

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
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              05 · Your motivation
            </h2>

            <div className="w-full flex flex-col gap-1">
              <label className="font-medium text-black text-sm block mb-2">
                Why do you want to join this Internship Program?{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tell us in your own words why you want to join this program…"
                className={cn(
                  "w-full px-4 py-3.5 border rounded-xl bg-white text-black text-sm",
                  "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
                  "hover:shadow-sm transition-all duration-200 ease-in-out outline-none resize-none",
                  "shadow-sm hover:shadow-md",
                  errors.joinReason
                    ? "border-red-500 hover:border-red-500 focus:border-red-500"
                    : "border-gray-300 hover:border-orange-400",
                )}
                {...register("joinReason")}
              />
              {errors.joinReason && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.joinReason.message}
                </p>
              )}
            </div>
          </div>

          {/* Class Representative Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              06 · Class representative
            </h2>

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
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              07 · Training preference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
              <Select
                label="Do you want a formal paid training to increase your chances for job?"
                options={yesNoOptions}
                value={watch("paidTraining")}
                onChange={(value) =>
                  setValue("paidTraining", value, { shouldValidate: true })
                }
                placeholder="Choose Your Option"
                required
                error={errors.paidTraining?.message}
              />
            </div>
          </div>

          {/* WhatsApp Group Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              08 · WhatsApp group
            </h2>
            <div className="p-3 md:p-4 border border-stone-200 bg-amber-50/40">
              <p className="text-sm text-gray-700 mb-3">
                <strong>
                  Join the WhatsApp group from below link as it is MANDATORY to
                  join the WhatsApp group for successful submission.
                </strong>{" "}
                HR/Admin will contact you in the group.
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
              onChange={(value) =>
                setValue("whatsappJoined", value, { shouldValidate: true })
              }
              placeholder="Choose Option"
              required
              error={errors.whatsappJoined?.message}
            />
          </div>

          {/* Referral Information Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 border-b pb-2">
              Referral Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
              <Select
                label="From where you got to know about us"
                options={referralSourceOptions}
                value={watch("referralSource")}
                onChange={(value) =>
                  setValue("referralSource", value, { shouldValidate: true })
                }
                placeholder="Choose Option"
                required
                error={errors.referralSource?.message}
              />
            </div>

            <div className="p-3 md:p-4 border border-stone-200 bg-sky-50/50">
              <p className="text-sm text-gray-700 mb-3">
                Follow us on social media to know more about the Internship and
                Job opportunities.
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
                        social.bgColor,
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
              onChange={(value) =>
                setValue("socialMediaFollowed", value, { shouldValidate: true })
              }
              placeholder="Choose Option"
              required
              error={errors.socialMediaFollowed?.message}
            />
          </div>

          {/* Academic Marks Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              10 · Academic marks
            </h2>

            <div className="space-y-4 md:space-y-6">
              {/* 10th Marks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
                <div className="w-full">
                  <Select
                    label="Marks in 10th – CGPA/%"
                    options={marksTypeOptions}
                    value={watch("marks10thType")}
                    onChange={(value) =>
                      setValue("marks10thType", value, { shouldValidate: true })
                    }
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
                    onChange={(value) =>
                      setValue("marks12thType", value, { shouldValidate: true })
                    }
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
                    onChange={(value) =>
                      setValue("marksPursuingType", value, {
                        shouldValidate: true,
                      })
                    }
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
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
              11 · Marketing (optional)
            </h2>
            <div className="w-full">
              <Select
                label="Do you want to take part in Marketing activities for the brand with some perks?"
                options={yesNoOptions}
                value={watch("marketingActivities")}
                onChange={(value) =>
                  setValue("marketingActivities", value, {
                    shouldValidate: true,
                  })
                }
                placeholder="Choose Option"
                required
                error={errors.marketingActivities?.message}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-8 mt-2 border-t border-stone-200">
            <p className="text-center text-xs text-stone-500 mb-4">
              By sending this, you confirm the details above are accurate for{" "}
              <span className="font-medium text-stone-700">
                {preview.internship.title}
              </span>
              .
            </p>
            <div className="flex flex-col items-stretch sm:items-center gap-2">
              <OrangeButton
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:min-w-56 py-3.5 text-base font-bold"
              >
                {isSubmitting
                  ? "Working on it…"
                  : isSeatFlow
                    ? "Continue to payment"
                    : "Send application"}
              </OrangeButton>
              {isSeatFlow && selectedBatch?.plan && (
                <p className="text-center text-xs text-stone-500">
                  Next: Paytm checkout for{" "}
                  <span className="font-semibold text-stone-800 tabular-nums">
                    ₹{selectedBatch.plan.amount.toLocaleString("en-IN")}
                  </span>
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollForm;
