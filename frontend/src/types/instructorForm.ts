import { z } from "zod";
import { passwordSchema } from "@/utils/passwordValidation";

export const instructorRegistrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^(\+91[0-9]{10}|[0-9]{10})$/, "Phone number must be 10 digits or +91 followed by 10 digits"),
    whatsappNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^(\+91[0-9]{10}|[0-9]{10})$/.test(val), {
        message: "WhatsApp number must be 10 digits or +91 followed by 10 digits",
      }),
    password: passwordSchema,
    confirmPassword: z.string(),
    profilePicture: z.string().optional(),
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    currentPosition: z.string().min(1, "Current position is required"),
    currentCompany: z.string().min(1, "Current company is required"),
    previousExperience: z.array(z.string()).optional(),
    address: z
      .object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
      })
      .optional(),
    linkedinUrl: z
      .string()
      .url("Invalid LinkedIn URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type InstructorRegistrationFormData = z.infer<
  typeof instructorRegistrationSchema
>;
