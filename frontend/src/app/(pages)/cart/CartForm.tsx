"use client";
import { Course, Student } from "@/types";
import CourseCardHolder from "./components/CourseCardHolder";
import { useState, useEffect } from "react";
import { calculateDiscountDisplay } from "@/lib/utils/discount";
import apiClient from "@/configs/apiConfig";
import CartFormHeader from "./components/CartFormHeader";
import GuidanceContainer from "./components/GuidanceContainer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Input from "@/components/ui/inputs/Input";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
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

interface EnrollmentFormData {
  name: string;
  email: string;
  phone: string;
  collegeName: string;
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

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

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

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      // Get the base price after plan discount
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
      const purchaseAmount = discountInfo.discountPrice;

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
          discountAmount: result.discountAmount || 0,
          finalAmount: result.finalAmount || purchaseAmount,
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email address"),
        phone: z.string().min(10, "Phone number must be 10 digits"),
        collegeName: z.string().min(1, "College name is required"),
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
      degreeName: (user as Student).degreeName || "",
      fatherOccupation: (user as Student).fatherOccupation || "",
      termsAndConditions: false,
    },
  });

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
                          required
                          placeholder="Search and select your college"
                          value={watch("collegeName")}
                          onChange={(value) => setValue("collegeName", value)}
                          error={errors.collegeName?.message}
                        />
                        <Input
                          label="Degree Name"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your degree name"
                          type="text"
                          required
                          {...register("degreeName")}
                          className={errors.degreeName ? "border-red-500" : ""}
                        />
                        {errors.degreeName && (
                          <p className="text-red-500 text-sm">
                            {errors.degreeName.message}
                          </p>
                        )}
                        <Input
                          label="Father Occupation"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your father occupation"
                          required
                          {...register("fatherOccupation")}
                          className={
                            errors.fatherOccupation ? "border-red-500" : ""
                          }
                        />
                        {errors.fatherOccupation && (
                          <p className="text-red-500 text-sm">
                            {errors.fatherOccupation.message}
                          </p>
                        )}
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
                            const planPrice =
                              planType === "elite"
                                ? course.plans?.elite?.price || 0
                                : course.plans?.essential?.price || 0;

                            const planDiscount =
                              course.plans?.[planType]?.discount;
                            const courseDiscount = course.discount;

                            const discountInfo = calculateDiscountDisplay(
                              planPrice,
                              planDiscount,
                              courseDiscount,
                            );

                            const finalAmount = appliedCoupon
                              ? appliedCoupon.finalAmount
                              : discountInfo.discountPrice;

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
                                        planPrice - discountInfo.discountPrice,
                                      )}
                                    </span>
                                  </div>
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
                              // Same calculation as Order Summary — send exact total so Paytm matches UI
                              const planPrice =
                                planType === "elite"
                                  ? course.plans?.elite?.price || 0
                                  : course.plans?.essential?.price || 0;
                              const discountInfo = calculateDiscountDisplay(
                                planPrice,
                                course.plans?.[planType]?.discount,
                                course.discount,
                              );
                              const totalAmount = appliedCoupon
                                ? appliedCoupon.finalAmount
                                : discountInfo.discountPrice;
                              const purchaseAmountBeforeCoupon =
                                discountInfo.discountPrice;

                              const orderData: any = {
                                courseId: course._id,
                                planType: planType,
                                userId: user._id,
                                totalAmount,
                                purchaseAmountBeforeCoupon,
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
