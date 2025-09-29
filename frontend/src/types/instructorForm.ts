import { z } from "zod";

export const instructorRegistrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    whatsappNumber: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
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
