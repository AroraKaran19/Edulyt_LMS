"use client";
import { Course } from "@/types";
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
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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
      })
    ),
    defaultValues: {
      name:
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : "",
      email: user?.email || "",
      phone: user?.phone || "",
      collegeName: "",
      degreeName: "",
      fatherOccupation: "",
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
        prev.map((step, i) => ({ ...step, isActive: i === index }))
      );
      return;
    }

    if (index === 1) {
      // T&C step - only allow if Application is completed
      if (!cartSteps[0].completed) {
        return; // Block if Application not completed
      }
      setCartSteps((prev) =>
        prev.map((step, i) => ({ ...step, isActive: i === index }))
      );
      return;
    }

    if (index === 2) {
      // Enroll step - only allow if both Application and T&C are completed
      if (!cartSteps[0].completed || !cartSteps[1].completed) {
        return; // Block if previous steps not completed
      }
      setCartSteps((prev) =>
        prev.map((step, i) => ({ ...step, isActive: i === index }))
      );
      return;
    }
  };

  // Auto-advance to next step when form becomes valid
  useEffect(() => {
    const currentActiveIndex = cartSteps.findIndex((step) => step.isActive);
    const currentStep = cartSteps[currentActiveIndex];

    if (currentStep?.title === "Application" && isValid && !isSubmitting) {
      // Move to next step after a short delay
      const timer = setTimeout(() => {
        setCartSteps((prev) =>
          prev.map((step, i) => ({
            ...step,
            isActive: i === currentActiveIndex + 1,
            completed: i === currentActiveIndex ? true : step.completed,
          }))
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isValid, isSubmitting, cartSteps]);

  return (
    <div className="w-full min-h-[calc(100dvh-78px)] flex flex-col lg:flex-row gap-6 items-start p-6 bg-[#f3f3f3]">
      <div className="w-full lg:w-1/3 min-h-0 max-h-[632px] lg:max-w-xl bg-white rounded-2xl p-1 order-2 xl:order-1">
        <CourseCardHolder course={course} />
      </div>
      <div className="w-full flex flex-col gap-6 order-1 xl:order-2">
        <CartFormHeader
          course={course}
          cartSteps={cartSteps}
          handleStepClick={handleStepClick}
        />
        <div className="w-full h-full flex gap-6">
          <div className="w-full lg:min-w-[520px] h-full bg-white rounded-2xl p-6">
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
                            e: React.KeyboardEvent<HTMLInputElement>
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
                            e: React.ClipboardEvent<HTMLInputElement>
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
                        <Input
                          label="College Name"
                          labelClassName="text-base text-text-primary font-bold"
                          placeholder="Enter your college name"
                          required
                          {...register("collegeName")}
                          className={errors.collegeName ? "border-red-500" : ""}
                        />
                        {errors.collegeName && (
                          <p className="text-red-500 text-sm">
                            {errors.collegeName.message}
                          </p>
                        )}
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
                              }))
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
                          src={encodeURI(
                            "/course-certificates/Certificates/Airkrit India Course Certificate - AI-01171 - Template.pdf"
                          )}
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
                              }))
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
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-text-primary mb-2">
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
                              courseDiscount
                            );

                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-text-primary">
                                    Course: {course.title}
                                  </span>
                                  <span className="font-semibold text-text-primary">
                                    ₹{planPrice}
                                  </span>
                                </div>

                                {discountInfo.discountLabel && (
                                  <div className="flex justify-between items-center text-green-600">
                                    <span>
                                      Discount Applied (
                                      {discountInfo.discountLabel})
                                    </span>
                                    <span>
                                      -₹{planPrice - discountInfo.discountPrice}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                  <span className="font-bold text-text-primary">
                                    Total Amount
                                  </span>
                                  <span className="font-bold text-text-primary text-lg">
                                    ₹{discountInfo.discountPrice}
                                  </span>
                                </div>
                              </>
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
                              toast.error("User authentication required. Please log in again.");
                              router.push("/login");
                              return;
                            }

                            setIsCreatingOrder(true);
                            try {
                              // Create order - Backend expects: courseId, planType, userId
                              // Note: Backend will calculate discounts internally
                              const orderData = {
                                courseId: course._id,
                                planType: planType,
                                userId: user._id, // Use authenticated user's ID
                              };

                              const response = await apiClient.post(
                                "/orders",
                                orderData
                              );
                              const order = response.data.data;

                              // Redirect to paytm-redirect page with order ID
                              // The backend sets a paymentToken cookie which will be used by paytm-redirect page
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
          <div className="hidden lg:block w-full max-w-[630px] h-full bg-white rounded-2xl shrink">
            <GuidanceContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartForm;
