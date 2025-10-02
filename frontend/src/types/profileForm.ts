import { z } from "zod";

// Base address schema
const addressSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

// Experience schema for both students and instructors
const experienceSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  duration: z.object({
    from: z.date(),
    to: z.date(),
  }),
  description: z.string().optional(),
});

// Base profile schema with common fields
const baseProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits").optional().or(z.literal("")),
  whatsappNumber: z.string().regex(/^\d{10}$/, "WhatsApp number must be 10 digits").optional().or(z.literal("")),
  profilePicture: z.string().url("Invalid URL format").optional().or(z.literal("")),
  dob: z.date().optional(),
  address: addressSchema,
});

// Student specific fields
const studentSpecificSchema = z.object({
  collegeName: z.string().optional(),
  passingYear: z.number()
    .min(1900, "Invalid year")
    .max(new Date().getFullYear() + 10, "Invalid passing year")
    .optional(),
  areaOfInterest: z.string().optional(),
  studentCurrentPosition: z.string().optional(),
  studentCurrentCompany: z.string().optional(),
  domain: z.string().optional(),
  portfolio: z.string().url("Portfolio must be a valid URL").optional().or(z.literal("")),
  experience: z.array(experienceSchema).optional(),
});

// Instructor specific fields
const instructorSpecificSchema = z.object({
  bio: z.string().optional(),
  instructorCurrentPosition: z.string().optional(),
  instructorCurrentCompany: z.string().optional(),
  linkedinUrl: z.string()
    .regex(
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
      "Invalid LinkedIn URL format"
    )
    .optional()
    .or(z.literal("")),
  previousExperience: z.array(experienceSchema).optional(),
});

// Complete profile schema combining all fields
export const profileFormSchema = baseProfileSchema
  .merge(studentSpecificSchema)
  .merge(instructorSpecificSchema);

// Type inference from schema
export type ProfileFormData = z.infer<typeof profileFormSchema>;

// Helper function to get default values based on user type and existing data
export const getDefaultValues = (user: any, userType: string): Partial<ProfileFormData> => {
  const baseDefaults = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    whatsappNumber: user?.whatsappNumber || "",
    profilePicture: user?.profilePicture || "",
    dob: user?.dob ? new Date(user.dob) : undefined,
    address: {
      address: user?.address?.address || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      country: user?.address?.country || "",
      pincode: user?.address?.pincode || "",
    },
  };

  if (userType === "student") {
    return {
      ...baseDefaults,
      collegeName: user?.collegeName || "",
      passingYear: user?.passingYear || undefined,
      areaOfInterest: user?.areaOfInterest || "",
      studentCurrentPosition: user?.currentPosition || "",
      studentCurrentCompany: user?.currentCompany || "",
      domain: user?.domain || "",
      portfolio: user?.portfolio || "",
      experience: user?.experience || [],
    };
  }

  if (userType === "instructor") {
    return {
      ...baseDefaults,
      bio: user?.bio || "",
      instructorCurrentPosition: user?.currentPosition || "",
      instructorCurrentCompany: user?.currentCompany || "",
      linkedinUrl: user?.linkedinUrl || "",
      previousExperience: user?.previousExperience || [],
    };
  }

  return baseDefaults;
};