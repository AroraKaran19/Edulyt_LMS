"use client";
import { Course, Student } from "@/types";
import CourseCardHolder from "./components/CourseCardHolder";
import { useState, useEffect, useMemo } from "react";
import {
  applyCollaborationBenefitToPrice,
  calculateDiscountDisplay,
} from "@/lib/utils/discount";
import type { CollaborationCheckoutResolve } from "@/types/collaborationDomain";
import apiClient from "@/configs/apiConfig";
import CartFormHeader from "./components/CartFormHeader";
import GuidanceContainer from "./components/GuidanceContainer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Input from "@/components/ui/inputs/Input";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import { User as UserIcon, Tag, X, Check } from "lucide-react";
import { useCoupon } from "@/hooks/useCoupon";

// PDF from public/assets (served at /assets/...)
const TERMS_PDF_PATH = "/assets/Terms and Conditions - Courses.pdf";

const FATHER_OCCUPATION_OPTIONS = [
  {
    value: "Professional",
    label: "Professional (Doctors, Engineers, Teachers, Lawyers, Accountants)",
  },
  { value: "Managerial/Executive", label: "Managerial/Executive" },
  {
    value: "Skilled Worker/Technician",
    label: "Skilled Worker/Technician (Electricians, Mechanics, Technicians)",
  },
  {
    value: "Service Worker",
    label: "Service Worker (Sales, Food Service, Protective Services)",
  },
  { value: "Agriculture/Farming", label: "Agriculture/Farming" },
  { value: "Homemaker", label: "Homemaker" },
  { value: "Unemployed/Retired", label: "Unemployed/Retired" },
  { value: "Other", label: "Other/Not Specified" },
];

const DEGREE_OPTIONS = [
  { value: "BA", label: "BA" },
  { value: "BSc", label: "BSc" },
  { value: "BCom", label: "BCom" },
  { value: "BBA", label: "BBA" },
  { value: "BCA", label: "BCA" },
  { value: "BTech/BE", label: "BTech/BE" },
  { value: "BArch", label: "BArch" },
  { value: "BDes", label: "BDes" },
  { value: "BFA", label: "BFA" },
  { value: "LLB", label: "LLB" },
  { value: "MBBS", label: "MBBS" },
  { value: "BDS", label: "BDS" },
  { value: "BPharm", label: "BPharm" },
  { value: "BPT", label: "BPT" },
  { value: "BHMS", label: "BHMS" },
  { value: "BAMS", label: "BAMS" },
  { value: "BNYS", label: "BNYS" },
  { value: "BSc Nursing", label: "BSc Nursing" },
  { value: "B.VSc & AH", label: "B.VSc & AH" },
  { value: "BSW", label: "BSW" },
  { value: "BEd", label: "BEd" },
  { value: "B.Lib.Sc", label: "B.Lib.Sc" },
  { value: "BJMC", label: "BJMC" },
  { value: "BHM", label: "BHM" },
  { value: "BFTech", label: "BFTech" },
  { value: "B.Sc. Agriculture", label: "B.Sc. Agriculture" },
  { value: "BSc IT", label: "BSc IT" },
  { value: "BSc Biotechnology", label: "BSc Biotechnology" },
  { value: "BSc Animation", label: "BSc Animation" },
  { value: "BSc Fashion Designing", label: "BSc Fashion Designing" },
  { value: "B.Voc", label: "B.Voc" },
  {
    value: "BSc Nursing (Post Basic)",
    label: "BSc Nursing (Post Basic) - For diploma holders advancing to degree",
  },
  { value: "MA", label: "MA" },
  { value: "MSc", label: "MSc" },
  { value: "MCom", label: "MCom" },
  { value: "MBA", label: "MBA" },
  { value: "MCA", label: "MCA" },
  { value: "MTech/ME", label: "MTech/ME" },
  { value: "MArch", label: "MArch" },
  { value: "MDes", label: "MDes" },
  { value: "MFA", label: "MFA" },
  { value: "LLM", label: "LLM" },
  { value: "MS", label: "MS" },
  { value: "MDS", label: "MDS" },
  { value: "MPharm", label: "MPharm" },
  { value: "MPT", label: "MPT" },
  { value: "MPH", label: "MPH" },
  { value: "M.Lib.Sc", label: "M.Lib.Sc" },
  { value: "MJMC", label: "MJMC" },
  { value: "MEd", label: "MEd" },
  { value: "M.Voc", label: "M.Voc" },
  { value: "MD (Postgraduate Medical)", label: "MD (Postgraduate Medical)" },
  { value: "PhD/DPhil", label: "PhD/DPhil" },
  { value: "DM", label: "DM" },
  { value: "MCh", label: "MCh" },
  { value: "MD (Ayurveda)", label: "MD (Ayurveda)" },
  {
    value: "MDS (Ayurveda/Homeopathy)",
    label: "MDS (Ayurveda/Homeopathy)",
  },
  { value: "DPharm", label: "DPharm" },
  { value: "PGDM", label: "PGDM (Post Graduate Diploma in Management)" },
  {
    value: "PGDBA",
    label: "PGDBA (Post Graduate Diploma in Business Administration)",
  },
  { value: "DMLT", label: "DMLT (Diploma in Medical Laboratory Technology)" },
  { value: "DPT", label: "DPT (Diploma in Physiotherapy)" },
  {
    value: "BTech + MTech (5-year integrated)",
    label: "BTech + MTech (5-year integrated)",
  },
  {
    value: "BA + MA (5-year integrated)",
    label: "BA + MA (5-year integrated)",
  },
  {
    value: "BBA + MBA (5-year integrated)",
    label: "BBA + MBA (5-year integrated)",
  },
  { value: "Other", label: "Other/Not Specified" },
];

interface EnrollmentFormData {
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  /** Canonical College _id (when user picks from the dropdown). Empty for
   *  custom text entries. */
  college: string;
  degreeName: string;
  fatherOccupation: string;
  termsAndConditions: boolean;
}

const CartForm = ({
  course,
  planType,
}: {
  course: Course;
  planType: "elite" | "essential";
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { validateCoupon } = useCoupon();
  const [showFirstNameModal, setShowFirstNameModal] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [isUpdatingFirstName, setIsUpdatingFirstName] = useState(false);

  // Father occupation: track dropdown selection for "Other" case
  const [selectedFatherOccupation, setSelectedFatherOccupation] =
    useState<string>("");

  // Degree: track dropdown selection for "Other" case
  const [selectedDegree, setSelectedDegree] = useState<string>("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [collabResolve, setCollabResolve] =
    useState<CollaborationCheckoutResolve | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);

  const checkoutPricing = useMemo(() => {
    const planPrice =
      planType === "elite"
        ? course.plans?.elite?.price || 0
        : course.plans?.essential?.price || 0;
    const planDiscount = course.plans?.[planType]?.discount;
    const courseDiscount = course.discount;
    const discountInfo = calculateDiscountDisplay(
      planPrice,
      planDiscount,
      courseDiscount,
    );
    const afterPlanCourse = discountInfo.discountPrice;
    const partnershipApplies =
      !!(
        collabResolve?.applies &&
        collabResolve.benefit &&
        collabResolve.benefit.value > 0
      );
    const afterCollaboration =
      partnershipApplies && collabResolve?.benefit
        ? applyCollaborationBenefitToPrice(
          afterPlanCourse,
          collabResolve.benefit,
        )
        : afterPlanCourse;
    const partnershipDiscountAmount = Math.max(
      0,
      afterPlanCourse - afterCollaboration,
    );
    return {
      planPrice,
      planDiscount,
      courseDiscount,
      discountInfo,
      afterPlanCourse,
      afterCollaboration,
      partnershipApplies,
      partnershipDiscountAmount,
      partnershipTitle: collabResolve?.title,
    };
  }, [planType, course, collabResolve]);

  useEffect(() => {
    if (!user?._id || !course._id) return;
    let cancelled = false;
    setCollabLoading(true);
    apiClient
      .post("/collaboration-domains/resolve", {
        courseIds: [course._id],
      })
      .then((res) => {
        if (!cancelled) {
          setCollabResolve(
            (res.data?.data as CollaborationCheckoutResolve) ?? {
              applies: false,
            },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCollabResolve({ applies: false });
      })
      .finally(() => {
        if (!cancelled) setCollabLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?._id, course._id]);

  useEffect(() => {
    if (collabResolve === null) return;
    setAppliedCoupon(null);
    setCouponCode("");
  }, [
    collabResolve?.collaborationDomainId,
    collabResolve?.partnershipImportConfigId,
  ]);

  // Check if user has firstName before allowing enrollment
  useEffect(() => {
    if (
      user &&
      !isLoading &&
      (!user.firstName || user.firstName.trim() === "")
    ) {
      setShowFirstNameModal(true);
    }
  }, [user, isLoading]);

  // Initialize father occupation dropdown from user data
  useEffect(() => {
    const occupation = (user as Student)?.fatherOccupation || "";
    if (occupation) {
      const isPreset = FATHER_OCCUPATION_OPTIONS.some(
        (o) => o.value === occupation,
      );
      setSelectedFatherOccupation(isPreset ? occupation : "Other");
    }
  }, [user]);

  // Initialize degree dropdown from user data
  useEffect(() => {
    const degree = (user as Student)?.degreeName || "";
    if (degree) {
      const isPreset = DEGREE_OPTIONS.some((o) => o.value === degree);
      setSelectedDegree(isPreset ? degree : "Other");
    }
  }, [user]);

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const purchaseAmount = checkoutPricing.afterCollaboration;

      if (!purchaseAmount || purchaseAmount <= 0) {
        toast.error("Invalid course pricing");
        return;
      }

      const result = await validateCoupon({
        code: couponCode.trim().toUpperCase(),
        courseId: course._id!,
        purchaseAmount,
      });

      if (result && result.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: result.discountAmount ?? 0,
          finalAmount: result.finalAmount ?? purchaseAmount,
        });
        toast.success(result.message || "Coupon applied successfully!");
      } else {
        toast.error(result?.message || "Invalid coupon code");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to validate coupon",
      );
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleUpdateFirstName = async () => {
    if (!firstNameInput.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsUpdatingFirstName(true);
    try {
      const response = await apiClient.put("/users/me", {
        firstName: firstNameInput.trim(),
      });

      if (response.data?.data) {
        const updatedUserData = response.data.data;

        // Update session with new firstName
        if (updateSession) {
          await updateSession({
            firstName: updatedUserData.firstName,
            lastName: updatedUserData.lastName,
            email: updatedUserData.email,
            phone: updatedUserData.phone,
            profilePicture: updatedUserData.profilePicture,
            userType: updatedUserData.userType,
          });
        }

        toast.success("First name updated successfully!");
        setShowFirstNameModal(false);
        // Refresh the page to get updated user data
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message ||
        "Failed to update first name. Please try again.",
      );
    } finally {
      setIsUpdatingFirstName(false);
    }
  };

  const [cartSteps, setCartSteps] = useState<
    { title: string; isActive?: boolean; completed: boolean }[]
  >([
    {
      title: "Application",
      isActive: true,
      completed: false,
    },
    {
      title: "T&C",
      completed: false,
    },
    {
      title: "Enroll",
      completed: false,
    },
  ]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100dvh-78px)] flex items-center justify-center bg-[#f3f3f3]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }
  // Partners aren't allowed to enroll — send them back to their dashboard
  // rather than letting them load the cart and get rejected by the server.
  if (user.userType === "partner") {
    return (
      <div className="w-full min-h-[calc(100dvh-78px)] flex items-center justify-center bg-[#f3f3f3] px-4">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            Partners can&apos;t enroll
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Partner accounts are read-only for student management. Please use a
            student account to purchase courses or internships.
          </p>
          <button
            type="button"
            onClick={() => router.push("/partner/college/dashboard")}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Back to partner dashboard
          </button>
        </div>
      </div>
    );
  }
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email address"),
        phone: z.string().min(10, "Phone number must be 10 digits"),
        collegeName: z.string().min(1, "College name is required"),
        // Always a string, possibly empty. Set when picked from the
        // dropdown; cleared on custom text. The snapshot in collegeName
        // is the mandatory display value.
        college: z.string(),
        degreeName: z.string().min(1, "Degree name is required"),
        fatherOccupation: z.string().min(1, "Father occupation is required"),
        termsAndConditions: z
          .boolean()
          .refine((val) => val, "You must accept the terms and conditions"),
      }),
    ),
    defaultValues: {
      name: user.firstName
        ? `${user.firstName} ${user.lastName}`
        : (user as any).name,
      email: user?.email || "",
      phone: user?.phone || "",
      collegeName: (user as Student).collegeName || "",
      college: (user as Student).college || "",
      degreeName: (user as Student).degreeName || "",
      fatherOccupation: (user as Student).fatherOccupation || "",
      termsAndConditions: false,
    },
  });

  // Fetch full profile from API (session may lack phone, college, degree, occupation)
  // and populate form when profile has more data than session
  useEffect(() => {
    if (!user?._id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/users/me");
        const profile = res.data?.data;
        if (!mounted || !profile) return;
        // Update form fields with profile data
        setValue("phone", profile.phone || "");
        setValue("collegeName", profile.collegeName || "");
        setValue("degreeName", profile.degreeName || "");
        setValue("fatherOccupation", profile.fatherOccupation || "");
        // Sync dropdown selections
        const degree = profile.degreeName || "";
        if (degree) {
          const isPreset = DEGREE_OPTIONS.some((o) => o.value === degree);
          setSelectedDegree(isPreset ? degree : "Other");
        }
        const occupation = profile.fatherOccupation || "";
        if (occupation) {
          const isPreset = FATHER_OCCUPATION_OPTIONS.some(
            (o) => o.value === occupation,
          );
          setSelectedFatherOccupation(isPreset ? occupation : "Other");
        }
      } catch {
        // Ignore - session data will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?._id, setValue]);

  const handleStepClick = (index: number) => {
    const currentActiveIndex = cartSteps.findIndex((step) => step.isActive);

    // If clicking on the same step, do nothing
    if (currentActiveIndex === index) return;

    // Hardcoded step validation logic
    if (index === 0) {
      // Application step - always allow going back to it
      setCartSteps((prev) =>
        prev.map((step, i) => ({ ...step, isActive: i === index })),
      );
      return;
    }

    if (index === 1) {
      // T&C step - only allow if Application is completed
      if (!cartSteps[0].completed) {
        return; // Block if Application not completed
      }
      setCartSteps((prev) =>
        prev.map((step, i) => ({ ...step, isActive: i === index })),
      );
      return;
    }

    if (index === 2) {
      // Enroll step - only allow if both Application and T&C are completed
      if (!cartSteps[0].completed || !cartSteps[1].completed) {
        return; // Block if previous steps not completed
      }
      setCartSteps((prev) =>
        prev.map((step, i) => ({ ...step, isActive: i === index })),
      );
      return;
    }
  };

  return (
    <div className="w-full min-h-[calc(100dvh-78px)] grid grid-cols-1 lg:grid-cols-[minmax(auto,540px)_1fr] gap-6 items-start p-6 bg-[#f3f3f3]">
      <div className="w-full order-2 lg:order-1 bg-white rounded-2xl p-1 lg:sticky lg:top-21">
        <CourseCardHolder course={course} />
      </div>
      <div className="w-full flex flex-col gap-6 order-1 lg:order-2">
        <CartFormHeader
          course={course}
          cartSteps={cartSteps}
          handleStepClick={handleStepClick}
        />
        <div className="w-full h-full flex gap-6">
          <div className="w-full lg:min-w-[550px] h-full bg-white rounded-2xl p-6">
            {(() => {
              const activeStep = cartSteps.find((step) => step.isActive);
              switch (activeStep?.title) {
                case "Application":
                  return (
                    <div className="w-full h-full flex flex-col gap-8">
                      <div className="heading w-full flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-text-primary">
                          Enter Your Details
                        </h2>
                        <span className="text-base text-text-primary">
                          To enroll you have to enter your details
                        </span>
                      </div>
                      <div className="form-data w-full flex flex-col gap-6">
                        <Input
                          label="Name"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your full name"
                          required
                          {...register("name")}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm">
                            {errors.name.message}
                          </p>
                        )}
                        <Input
                          label="Email Address"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your email address"
                          type="email"
                          required
                          {...register("email")}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm">
                            {errors.email.message}
                          </p>
                        )}
                        <Input
                          label="Phone Number"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your phone number"
                          type="tel"
                          required
                          pattern="[0-9]*"
                          inputMode="numeric"
                          onKeyDown={(
                            e: React.KeyboardEvent<HTMLInputElement>,
                          ) => {
                            // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                            if (
                              [
                                8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40,
                              ].indexOf(e.keyCode) !== -1 ||
                              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                              (e.keyCode === 65 && e.ctrlKey === true) ||
                              (e.keyCode === 67 && e.ctrlKey === true) ||
                              (e.keyCode === 86 && e.ctrlKey === true) ||
                              (e.keyCode === 88 && e.ctrlKey === true)
                            ) {
                              return;
                            }
                            // Ensure that it is a number and stop the keypress
                            if (
                              (e.shiftKey ||
                                e.keyCode < 48 ||
                                e.keyCode > 57) &&
                              (e.keyCode < 96 || e.keyCode > 105)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(
                            e: React.ClipboardEvent<HTMLInputElement>,
                          ) => {
                            // Get pasted data
                            const paste = e.clipboardData.getData("text");
                            // Check if pasted data contains non-numeric characters
                            if (!/^\d+$/.test(paste)) {
                              e.preventDefault();
                            }
                          }}
                          {...register("phone")}
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm">
                            {errors.phone.message}
                          </p>
                        )}
                        <div className="h-px w-full bg-gray-200" />
                        <div className="heading w-full flex flex-col gap-2">
                          <h2 className="text-2xl font-bold text-text-primary">
                            Enter Your Education Details
                          </h2>
                          <span className="text-base text-text-primary">
                            To enroll you have to enter your education details
                          </span>
                        </div>
                        <CollegeSelect
                          label="College Name"
                          labelClassName="text-base text-text-primary font-bold"
                          required
                          placeholder="Search and select your college"
                          value={watch("collegeName")}
                          onChange={(value) => {
                            setValue("collegeName", value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            // Custom-text entry → clear the canonical ID so
                            // we don't ship a stale link with a fresh name.
                            setValue("college", "", { shouldDirty: true });
                          }}
                          onSelect={(c) => {
                            setValue("collegeName", c.display, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            setValue("college", c._id, { shouldDirty: true });
                          }}
                          error={errors.collegeName?.message}
                        />
                        <div className="flex flex-col gap-2">
                          <Select
                            label="Degree Name"
                            labelClassName="text-base text-text-primary font-bold"
                            placeholder="Select your degree"
                            required
                            options={DEGREE_OPTIONS}
                            searchable
                            searchPlaceholder="Search degrees..."
                            value={selectedDegree}
                            onChange={(value) => {
                              setSelectedDegree(value);
                              if (value !== "Other") {
                                setValue("degreeName", value);
                              } else {
                                setValue("degreeName", "");
                              }
                            }}
                            error={errors.degreeName?.message}
                            className={
                              errors.degreeName ? "border-red-500" : ""
                            }
                          />
                          {selectedDegree === "Other" && (
                            <Input
                              label="Specify Degree"
                              labelClassName="text-base text-text-primary font-bold"
                              placeholder="Enter your degree name"
                              value={watch("degreeName")}
                              onChange={(e) =>
                                setValue("degreeName", e.target.value)
                              }
                              className={
                                errors.degreeName ? "border-red-500" : ""
                              }
                            />
                          )}
                          {errors.degreeName && (
                            <p className="text-red-500 text-sm">
                              {errors.degreeName.message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select
                            label="Father Occupation"
                            labelClassName="text-base text-text-primary font-bold"
                            placeholder="Select father occupation"
                            required
                            options={FATHER_OCCUPATION_OPTIONS}
                            searchable
                            searchPlaceholder="Search occupations..."
                            value={selectedFatherOccupation}
                            onChange={(value) => {
                              setSelectedFatherOccupation(value);
                              if (value !== "Other") {
                                setValue("fatherOccupation", value);
                              } else {
                                setValue("fatherOccupation", "");
                              }
                            }}
                            error={errors.fatherOccupation?.message}
                            className={
                              errors.fatherOccupation ? "border-red-500" : ""
                            }
                          />
                          {selectedFatherOccupation === "Other" && (
                            <Input
                              label="Specify Occupation"
                              labelClassName="text-base text-text-primary font-bold"
                              placeholder="Enter your father occupation"
                              value={watch("fatherOccupation")}
                              onChange={(e) =>
                                setValue("fatherOccupation", e.target.value)
                              }
                              className={
                                errors.fatherOccupation ? "border-red-500" : ""
                              }
                            />
                          )}
                          {errors.fatherOccupation && (
                            <p className="text-red-500 text-sm">
                              {errors.fatherOccupation.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <OrangeButton
                        className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
                        glow
                        disabled={isSubmitting}
                        onClick={async () => {
                          const isFormValid = await trigger([
                            "name",
                            "email",
                            "phone",
                            "collegeName",
                            "degreeName",
                            "fatherOccupation",
                          ]);

                          if (isFormValid) {
                            // Mark current step as completed before moving to next
                            setCartSteps((prev) =>
                              prev.map((step, i) => ({
                                ...step,
                                completed: i === 0 ? true : step.completed,
                                isActive: i === 1,
                              })),
                            );
                          }
                        }}
                      >
                        Next
                      </OrangeButton>
                    </div>
                  );
                case "T&C":
                  return (
                    <div className="w-full h-full flex flex-col gap-8">
                      <div className="heading w-full flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-text-primary">
                          Terms & Conditions
                        </h2>
                        <span className="text-base text-text-primary">
                          Please read and accept the terms and conditions
                        </span>
                      </div>
                      <div className="w-full h-96 flex flex-col gap-2">
                        <iframe
                          src={encodeURI(TERMS_PDF_PATH)}
                          title="Terms & Conditions"
                          className="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                      <div className="w-full flex flex-col gap-2">
                        <CheckBoxContainer
                          label="I accept the terms and conditions"
                          required
                          checked={watch("termsAndConditions")}
                          setChange={(checked) => {
                            register("termsAndConditions").onChange({
                              target: {
                                name: "termsAndConditions",
                                value: checked,
                              },
                            });
                          }}
                          className={
                            errors.termsAndConditions ? "border-red-500" : ""
                          }
                        />
                        {errors.termsAndConditions && (
                          <p className="text-red-500 text-sm">
                            {errors.termsAndConditions.message}
                          </p>
                        )}
                      </div>
                      <OrangeButton
                        className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
                        glow
                        disabled={isSubmitting}
                        onClick={async () => {
                          const isFormValid = await trigger([
                            "termsAndConditions",
                          ]);
                          if (isFormValid) {
                            setCartSteps((prev) =>
                              prev.map((step, i) => ({
                                ...step,
                                completed: i === 1 ? true : step.completed,
                                isActive: i === 2,
                              })),
                            );
                          }
                        }}
                      >
                        Continue
                      </OrangeButton>
                    </div>
                  );
                case "Enroll":
                  return (
                    <div className="w-full h-full flex flex-col gap-8">
                      <div className="heading w-full flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-text-primary">
                          Complete Your Enrollment
                        </h2>
                        <span className="text-base text-text-primary">
                          Click the button below to proceed to payment and
                          complete your enrollment
                        </span>
                      </div>
                      <div className="w-full flex flex-col gap-4">
                        {/* Coupon Code Section */}
                        <div className="bg-linear-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                          <label className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                            <Tag className="w-4 h-4 text-orange-600" />
                            Have a coupon code?
                          </label>
                          {!appliedCoupon ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) =>
                                  setCouponCode(e.target.value.toUpperCase())
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleApplyCoupon();
                                  }
                                }}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase font-mono"
                                disabled={isValidatingCoupon}
                              />
                              <OrangeButton
                                onClick={handleApplyCoupon}
                                disabled={
                                  isValidatingCoupon || !couponCode.trim()
                                }
                                className="px-6 whitespace-nowrap"
                              >
                                {isValidatingCoupon ? "Checking..." : "Apply"}
                              </OrangeButton>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-green-800 font-mono">
                                  {appliedCoupon.code}
                                </span>
                                <span className="text-sm text-green-600 font-medium">
                                  applied
                                </span>
                              </div>
                              <button
                                onClick={handleRemoveCoupon}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors"
                                title="Remove coupon"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-text-primary mb-3">
                            Order Summary
                          </h3>
                          {(() => {
                            const {
                              planPrice,
                              discountInfo,
                              afterPlanCourse,
                              afterCollaboration,
                              partnershipApplies,
                              partnershipDiscountAmount,
                              partnershipTitle,
                            } = checkoutPricing;

                            const finalAmount = appliedCoupon
                              ? appliedCoupon.finalAmount
                              : afterCollaboration;

                            // Round to 2 decimal places for display to avoid floating-point precision issues (e.g. 0.34999999999999964 → 0.35)
                            const formatPrice = (n: number) =>
                              Number.isInteger(n)
                                ? String(n)
                                : Number(n.toFixed(2)).toString();

                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-text-primary text-sm">
                                    Course Price
                                  </span>
                                  <span className="font-semibold text-text-primary">
                                    ₹{formatPrice(planPrice)}
                                  </span>
                                </div>

                                {discountInfo.discountLabel && (
                                  <div className="flex justify-between items-center text-green-600">
                                    <span className="text-sm">
                                      Plan Discount (
                                      {discountInfo.discountLabel})
                                    </span>
                                    <span className="text-sm font-medium">
                                      -₹
                                      {formatPrice(
                                        planPrice - afterPlanCourse,
                                      )}
                                    </span>
                                  </div>
                                )}

                                {partnershipApplies &&
                                  partnershipDiscountAmount > 0 && (
                                    <div className="flex justify-between items-center text-indigo-700">
                                      <span className="text-sm">
                                        Partnership Discount (
                                        {collabResolve?.benefit?.type === "percentage"
                                          ? `${collabResolve.benefit.value}% off`
                                          : `₹${formatPrice(collabResolve?.benefit?.value ?? 0)} off`}
                                        )
                                      </span>
                                      <span className="text-sm font-medium">
                                        -₹{formatPrice(partnershipDiscountAmount)}
                                      </span>
                                    </div>
                                  )}

                                {collabLoading && (
                                  <p className="text-xs text-gray-500">
                                    Checking partnership pricing…
                                  </p>
                                )}

                                {appliedCoupon && (
                                  <div className="flex justify-between items-center text-orange-600">
                                    <span className="text-sm font-medium">
                                      Coupon ({appliedCoupon.code})
                                    </span>
                                    <span className="text-sm font-bold">
                                      -₹
                                      {formatPrice(
                                        appliedCoupon.discountAmount,
                                      )}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center border-t-2 pt-3 mt-2">
                                  <span className="font-bold text-text-primary text-base">
                                    Total Amount
                                  </span>
                                  <span className="font-bold text-orange-600 text-xl">
                                    {finalAmount < 1
                                      ? "FREE"
                                      : `₹${formatPrice(finalAmount)}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <OrangeButton
                          className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
                          glow
                          disabled={isCreatingOrder}
                          onClick={async () => {
                            // Ensure user is authenticated and has an ID
                            if (!user?._id) {
                              toast.error(
                                "User authentication required. Please log in again.",
                              );
                              router.push("/login");
                              return;
                            }

                            setIsCreatingOrder(true);
                            try {
                              // Update user profile with form data (college, degree, father occupation, etc.)
                              const formData = getValues();
                              const nameParts = (formData.name || "")
                                .trim()
                                .split(/\s+/);
                              const firstName = nameParts[0] || "";
                              const lastName =
                                nameParts.slice(1).join(" ") || "";
                              await apiClient.put("/users/me", {
                                firstName,
                                lastName,
                                email: formData.email,
                                phone: formData.phone,
                                collegeName: formData.collegeName,
                                // Canonical ID-link (when picked from
                                // dropdown). Empty for custom text — we
                                // explicitly send "" so any prior link is
                                // cleared on the server.
                                college: formData.college || "",
                                degreeName: formData.degreeName,
                                fatherOccupation: formData.fatherOccupation,
                              });

                              const orderData: any = {
                                courseId: course._id,
                                planType: planType,
                                userId: user._id,
                              };
                              if (appliedCoupon) {
                                orderData.couponCode = appliedCoupon.code;
                              }

                              const response = await apiClient.post(
                                "/orders",
                                orderData,
                              );
                              const order = response.data.data;

                              // If order is free (amount < ₹1), go directly to success page
                              if (order.freeOrder && order.token) {
                                window.location.href = `/payment/status/${order._id}?token=${order.token}`;
                                return;
                              }

                              // Redirect to paytm-redirect page with order ID
                              window.location.href = `/paytm-redirect?orderId=${order._id}`;
                            } catch (error: any) {
                              console.error("Error creating order:", error);

                              // Handle different types of errors
                              let errorMessage =
                                "Failed to create order. Please try again.";

                              if (error.response?.data?.message) {
                                errorMessage = error.response.data.message;
                              } else if (error.serverMessage) {
                                errorMessage = error.serverMessage;
                              } else if (error.message) {
                                errorMessage = error.message;
                              }

                              // Show error message as toast notification
                              toast.error(errorMessage);
                            } finally {
                              setIsCreatingOrder(false);
                            }
                          }}
                        >
                          {isCreatingOrder
                            ? "Creating Order..."
                            : "Proceed to Payment"}
                        </OrangeButton>
                      </div>
                    </div>
                  );
                default:
                  return <div>Select a step</div>;
              }
            })()}
          </div>
          <div className="hidden lg:block lg:sticky lg:top-21 w-full lg:min-w-[200px] max-w-[630px] h-max bg-white rounded-2xl shrink">
            <GuidanceContainer />
          </div>
        </div>
      </div>

      {/* First Name Required Modal */}
      <Modal
        isOpen={showFirstNameModal}
        onClose={() => {
          // Don't allow closing - user must set firstName
          toast.error("First name is required to enroll in courses");
        }}
        className="max-w-md"
      >
        <div className="flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <UserIcon className="w-10 h-10 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            First Name Required
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Please provide your first name to continue with course enrollment.
          </p>
          <div className="w-full mb-4">
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={firstNameInput}
              onChange={(e) => setFirstNameInput(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <OrangeButton
            onClick={handleUpdateFirstName}
            disabled={isUpdatingFirstName || !firstNameInput.trim()}
            className="w-full"
          >
            {isUpdatingFirstName ? "Updating..." : "Update & Continue"}
          </OrangeButton>
        </div>
      </Modal>
    </div>
  );
};

export default CartForm;
