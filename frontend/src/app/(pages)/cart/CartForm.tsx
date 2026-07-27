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
import useReferral from "@/hooks/useReferral";
import {
  DEGREE_OPTIONS,
  FATHER_OCCUPATION_OPTIONS,
} from "@/lib/constants/profileOptions";
import { CATEGORY_SIBLING_PERK_ENABLED } from "@/lib/featureFlags";
import YourCoursesStep from "./components/YourCoursesStep";
import type { Category } from "@/types";
import { useCheckout } from "@/hooks/useCheckout";
import type { CheckoutOrder } from "@/types/order";

// Primary category id of a course = first entry of its category array. Handles
// both the id-only (string) and populated Category-object shapes.
const getPrimaryCategoryId = (
  category: Course["category"] | undefined,
): string | undefined => {
  const first = category?.[0];
  if (!first) return undefined;
  return typeof first === "string" ? first : (first as Category)._id;
};

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

  // Referral code state — credits the referrer AND (when an admin has
  // configured a buyer discount %) takes that % off the buyer's price.
  // Stacks on top of any coupon.
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<{
    code: string;
    referrerName: string;
    buyerDiscountPercent: number;
  } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  const [collabResolve, setCollabResolve] =
    useState<CollaborationCheckoutResolve | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);

  // Success-points redemption at checkout (per-plan cap × admin redemption rate).
  const [useSuccessPoints, setUseSuccessPoints] = useState(false);
  const [successPointsBalance, setSuccessPointsBalance] = useState<number>(0);
  const [redemptionRate, setRedemptionRate] = useState<number>(0);
  const [maxUtilizationPercent, setMaxUtilizationPercent] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [balanceRes, rateRes] = await Promise.all([
          apiClient.get("/success-points/me"),
          apiClient.get("/success-points/redemption-rate"),
        ]);
        if (cancelled) return;
        setSuccessPointsBalance(Number(balanceRes.data?.data?.balance ?? 0));
        setRedemptionRate(
          Number(rateRes.data?.data?.successPointRedemptionInr ?? 0),
        );
        setMaxUtilizationPercent(
          Number(
            rateRes.data?.data?.successPointsMaxUtilizationPercent ?? 0,
          ),
        );
      } catch {
        if (!cancelled) {
          setSuccessPointsBalance(0);
          setRedemptionRate(0);
          setMaxUtilizationPercent(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Admin-managed Terms & Conditions document. When none is configured the
  // T&C step is skipped entirely (see effect below).
  const [courseTermsUrl, setCourseTermsUrl] = useState<string>("");
  const [termsLoaded, setTermsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/legal-settings");
        if (!cancelled) {
          setCourseTermsUrl(String(res.data?.data?.courseTermsUrl ?? ""));
        }
      } catch {
        if (!cancelled) setCourseTermsUrl("");
      } finally {
        if (!cancelled) setTermsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sibling courses in the same primary category, granted free when the
  // CATEGORY_SIBLING_ENROLLMENT_ENABLED perk is on. Drives the "Courses"
  // step: the step is shown only when the perk is on AND ≥1 sibling exists.
  const [siblingCourses, setSiblingCourses] = useState<Course[]>([]);
  const [siblingsLoaded, setSiblingsLoaded] = useState(false);
  useEffect(() => {
    if (!CATEGORY_SIBLING_PERK_ENABLED) {
      setSiblingsLoaded(true);
      return;
    }
    const primaryCategoryId = getPrimaryCategoryId(course.category);
    if (!primaryCategoryId) {
      setSiblingsLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(
          `/courses?categories=${primaryCategoryId}&limit=50`,
        );
        const list: Course[] = res.data?.data?.courses ?? [];
        const siblings = list.filter(
          (c) => c._id !== course._id && c.slug !== course.slug,
        );
        if (!cancelled) setSiblingCourses(siblings);
      } catch {
        if (!cancelled) setSiblingCourses([]);
      } finally {
        if (!cancelled) setSiblingsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [course._id, course.slug, course.category]);

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

  // Success-points preview — the single source of truth for both the opt-in
  // tick and the order summary. Points stack AFTER coupon + referral and are
  // capped at the admin `maxUtilizationPercent` of the amount due (and never
  // exceed it). Server re-computes authoritatively at order creation.
  const successPointsPreview = useMemo(() => {
    const afterCollaboration = checkoutPricing.afterCollaboration;
    const baseAfterCoupon = appliedCoupon
      ? appliedCoupon.finalAmount
      : afterCollaboration;
    const referralDiscountAmount =
      appliedReferral && appliedReferral.buyerDiscountPercent > 0
        ? Math.round(
            baseAfterCoupon * (appliedReferral.buyerDiscountPercent / 100) *
              100,
          ) / 100
        : 0;
    const finalAmountBeforePoints =
      Math.round((baseAfterCoupon - referralDiscountAmount) * 100) / 100;

    const maxPct = Math.min(100, Math.max(0, maxUtilizationPercent));
    const balance = Math.max(0, Math.floor(successPointsBalance));

    let pointsApplied = 0;
    let discount = 0;
    if (
      maxPct > 0 &&
      redemptionRate > 0 &&
      balance > 0 &&
      finalAmountBeforePoints > 0
    ) {
      const maxDiscountByPct =
        Math.round(finalAmountBeforePoints * (maxPct / 100) * 100) / 100;
      const maxPointsByPct = Math.floor(maxDiscountByPct / redemptionRate);
      const maxPointsByDue = Math.floor(
        finalAmountBeforePoints / redemptionRate,
      );
      pointsApplied = Math.max(
        0,
        Math.min(balance, maxPointsByPct, maxPointsByDue),
      );
      discount =
        Math.round(
          Math.min(pointsApplied * redemptionRate, finalAmountBeforePoints) *
            100,
        ) / 100;
    }

    return {
      // Redemption is offered only when the user could actually spend ≥1 point.
      canUse: pointsApplied > 0,
      maxPct,
      finalAmountBeforePoints,
      pointsApplied,
      discount,
    };
  }, [
    checkoutPricing,
    appliedCoupon,
    appliedReferral,
    maxUtilizationPercent,
    redemptionRate,
    successPointsBalance,
  ]);

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

  // Referral code apply/remove. The code credits the referrer and applies the
  // admin-configured buyer discount %, stacking on top of any coupon.
  const { validateCode: validateReferralCode } = useReferral();
  const handleApplyReferral = async () => {
    const code = referralCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a referral code");
      return;
    }
    setIsValidatingReferral(true);
    try {
      const result = await validateReferralCode(code);
      if (result.valid) {
        const pct = Number(result.buyerDiscountPercent ?? 0);
        setAppliedReferral({
          code,
          referrerName: result.referrerName ?? "Referrer",
          buyerDiscountPercent:
            Number.isFinite(pct) && pct > 0 ? pct : 0,
        });
        toast.success(
          pct > 0
            ? `Referral applied ${pct}% off · Courtesy ${result.referrerName}`
            : `Referral code applied, Courtesy ${result.referrerName}`,
        );
      } else if (result.reason === "self") {
        toast.error("You can't use your own referral code.");
      } else if (result.reason === "not-found") {
        toast.error("Referral code not found.");
      } else {
        toast.error("Invalid referral code.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message ?? "Failed to validate referral code",
      );
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleRemoveReferral = () => {
    setAppliedReferral(null);
    setReferralCodeInput("");
    toast.info("Referral code removed");
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
  >(() => {
    const steps = [
      { title: "Application", isActive: true, completed: false },
      { title: "T&C", completed: false },
      { title: "Enroll", completed: false },
    ];
    // Insert "Courses" after Application when the perk is on. If it turns
    // out there are no sibling courses, the effect below removes it again.
    if (CATEGORY_SIBLING_PERK_ENABLED) {
      steps.splice(1, 0, { title: "Courses", completed: false });
    }
    return steps;
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { start, picker } = useCheckout();

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
            onClick={() => router.push("/partner/dashboard")}
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
        collegeName: z.string().min(1, "University / College name is required"),
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

  // No admin-configured T&C document → skip the T&C step entirely: drop it
  // from the stepper and auto-satisfy the acceptance so the order can proceed.
  useEffect(() => {
    if (!termsLoaded || courseTermsUrl) return;
    setValue("termsAndConditions", true);
    setCartSteps((prev) => {
      if (!prev.some((s) => s.title === "T&C")) return prev;
      const tcWasActive = prev.find((s) => s.title === "T&C")?.isActive;
      const filtered = prev.filter((s) => s.title !== "T&C");
      // If the user had already advanced onto T&C, move them on to Enroll.
      return tcWasActive
        ? filtered.map((s) => ({ ...s, isActive: s.title === "Enroll" }))
        : filtered;
    });
  }, [termsLoaded, courseTermsUrl, setValue]);

  // Perk is on but this course has no free siblings → drop the "Courses"
  // step. If the user was already on it, advance them to whatever step now
  // occupies that position.
  useEffect(() => {
    if (!CATEGORY_SIBLING_PERK_ENABLED) return;
    if (!siblingsLoaded || siblingCourses.length > 0) return;
    setCartSteps((prev) => {
      const idx = prev.findIndex((s) => s.title === "Courses");
      if (idx === -1) return prev;
      const wasActive = prev[idx].isActive;
      const filtered = prev.filter((s) => s.title !== "Courses");
      if (!wasActive) return filtered;
      const nextIdx = Math.min(idx, filtered.length - 1);
      return filtered.map((s, i) => ({ ...s, isActive: i === nextIdx }));
    });
  }, [siblingsLoaded, siblingCourses.length]);

  // Mark the given step complete and activate the one after it. Position-based
  // so it stays correct no matter which optional steps (Your Courses, T&C) are
  // present.
  const advanceFrom = (title: string) => {
    setCartSteps((prev) => {
      const idx = prev.findIndex((step) => step.title === title);
      if (idx === -1) return prev;
      return prev.map((step, i) => ({
        ...step,
        completed: i === idx ? true : step.completed,
        isActive: i === idx + 1,
      }));
    });
  };

  const handleStepClick = (index: number) => {
    const currentActiveIndex = cartSteps.findIndex((step) => step.isActive);
    if (currentActiveIndex === index) return;
    // Allow navigating to a step only if every earlier step is completed.
    const priorCompleted = cartSteps
      .slice(0, index)
      .every((step) => step.completed);
    if (!priorCompleted) return;
    setCartSteps((prev) =>
      prev.map((step, i) => ({ ...step, isActive: i === index })),
    );
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
                          label="University / College Name"
                          labelClassName="text-base text-text-primary font-bold"
                          required
                          placeholder="Search and select your university / college"
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
                            advanceFrom("Application");
                          }
                        }}
                      >
                        Next
                      </OrangeButton>
                    </div>
                  );
                case "Courses":
                  return (
                    <YourCoursesStep
                      course={course}
                      siblings={siblingCourses}
                      loading={!siblingsLoaded}
                      onContinue={() => advanceFrom("Courses")}
                    />
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
                          src={encodeURI(courseTermsUrl)}
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
                            advanceFrom("T&C");
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

                        {/* Referral Code Section — credits the referrer and applies the configured buyer discount. */}
                        <div className="bg-linear-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4">
                          <label className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-violet-600" />
                            Have a referral code?
                          </label>
                          <div className="flex flex-col gap-1.5 mb-3">
                            <p className="text-xs text-violet-700/80 flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>
                                Enter it at checkout to instantly get your
                                discount.
                              </span>
                            </p>
                            <p className="text-xs text-violet-700/80 flex items-start gap-2">
                              <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <span>
                                Don&apos;t have one? Contact the person who
                                referred you to receive your unique code.
                              </span>
                            </p>
                          </div>
                          {!appliedReferral ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter referral code"
                                value={referralCodeInput}
                                onChange={(e) =>
                                  setReferralCodeInput(
                                    e.target.value.toUpperCase(),
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleApplyReferral();
                                }}
                                disabled={isValidatingReferral}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent uppercase font-mono"
                              />
                              <OrangeButton
                                onClick={handleApplyReferral}
                                disabled={
                                  isValidatingReferral ||
                                  !referralCodeInput.trim()
                                }
                                className="px-6 whitespace-nowrap"
                              >
                                {isValidatingReferral ? "Checking..." : "Apply"}
                              </OrangeButton>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-violet-50 border-2 border-violet-300 rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Check className="w-5 h-5 text-violet-600 shrink-0" />
                                <span className="font-bold text-violet-800 font-mono shrink-0">
                                  {appliedReferral.code}
                                </span>
                                <span className="text-sm text-violet-700 font-medium truncate">
                                  {appliedReferral.buyerDiscountPercent > 0
                                    ? `· ${appliedReferral.buyerDiscountPercent}% off · Courtesy ${appliedReferral.referrerName}`
                                    : `· Courtesy ${appliedReferral.referrerName}`}
                                </span>
                              </div>
                              <button
                                onClick={handleRemoveReferral}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors"
                                title="Remove referral code"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Use Success Points */}
                        {successPointsPreview.canUse && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useSuccessPoints}
                                onChange={(e) =>
                                  setUseSuccessPoints(e.target.checked)
                                }
                                className="mt-1 w-4 h-4 accent-[#F77124] cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  Use my success points
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  You have{" "}
                                  <span className="font-bold text-[#F77124]">
                                    {successPointsBalance}
                                  </span>{" "}
                                  points. Up to {successPointsPreview.maxPct}% of
                                  this order can be paid with points {" "}
                                  {successPointsPreview.pointsApplied} pts (₹
                                  {successPointsPreview.discount.toFixed(2)} off).
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

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

                            // Coupon applies first; the referral buyer discount
                            // then stacks on the post-coupon amount (mirrors the
                            // backend, which re-computes for safety).
                            const baseAfterCoupon = appliedCoupon
                              ? appliedCoupon.finalAmount
                              : afterCollaboration;

                            const referralDiscountAmount =
                              appliedReferral &&
                              appliedReferral.buyerDiscountPercent > 0
                                ? Math.round(
                                    baseAfterCoupon *
                                      (appliedReferral.buyerDiscountPercent /
                                        100) *
                                      100,
                                  ) / 100
                                : 0;

                            const finalAmountBeforePoints =
                              Math.round(
                                (baseAfterCoupon - referralDiscountAmount) *
                                  100,
                              ) / 100;

                            // Success-points discount (shared with the opt-in
                            // tick; server re-computes authoritatively). Only
                            // counts when the buyer has ticked the box.
                            const pointsApplied = useSuccessPoints
                              ? successPointsPreview.pointsApplied
                              : 0;
                            const pointsDiscount = useSuccessPoints
                              ? successPointsPreview.discount
                              : 0;
                            const finalAmount = Math.max(
                              0,
                              Math.round(
                                (finalAmountBeforePoints - pointsDiscount) *
                                  100,
                              ) / 100,
                            );

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

                                {referralDiscountAmount > 0 && (
                                  <div className="flex justify-between items-center text-violet-700">
                                    <span className="text-sm font-medium">
                                      Referral Discount (
                                      {appliedReferral?.buyerDiscountPercent}%)
                                    </span>
                                    <span className="text-sm font-bold">
                                      -₹{formatPrice(referralDiscountAmount)}
                                    </span>
                                  </div>
                                )}

                                {pointsDiscount > 0 && (
                                  <div className="flex justify-between items-center text-[#F77124]">
                                    <span className="text-sm font-medium">
                                      Success Points ({pointsApplied} pts)
                                    </span>
                                    <span className="text-sm font-bold">
                                      -₹{formatPrice(pointsDiscount)}
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

                              // Mirror the writes into the active NextAuth
                              // session so subsequent pages reading from
                              // useSession() see the new values without a
                              // reload. Best-effort — DB is source of truth.
                              // NOTE: we deliberately do NOT call updateSession()
                              // here. It refreshes the NextAuth session, which
                              // remounts this component and wipes its state —
                              // including the gateway picker, which has to stay
                              // open while the learner chooses. The old Paytm
                              // code got away with it only because it navigated
                              // away immediately. The write above is already
                              // persisted (DB is source of truth), and every exit
                              // from here is a full page load — Paytm redirect,
                              // Razorpay → status page, or the free-order status
                              // page — so the session is re-read server-side
                              // regardless.

                              const orderData: any = {
                                courseId: course._id,
                                planType: planType,
                                userId: user._id,
                              };
                              if (appliedCoupon) {
                                orderData.couponCode = appliedCoupon.code;
                              }
                              if (appliedReferral) {
                                orderData.referralCode = appliedReferral.code;
                              }
                              if (useSuccessPoints) {
                                orderData.useSuccessPoints = true;
                              }

                              // Resolves the gateway (picker when there's a
                              // choice), creates the order with it, then opens
                              // that gateway's checkout. The free-order branch
                              // is handled inside useCheckout.
                              await start(async (gateway) => {
                                const response = await apiClient.post(
                                  "/orders",
                                  { ...orderData, gateway },
                                );
                                const order = response.data
                                  .data as CheckoutOrder;
                                if (!order?._id) {
                                  throw new Error("Order creation failed");
                                }
                                return order;
                              });
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
      {picker}
    </div>
  );
};

export default CartForm;
