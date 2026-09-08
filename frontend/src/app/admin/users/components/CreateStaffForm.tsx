"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Megaphone, Trash2, Upload, User } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { useUpload } from "@/hooks/useUpload";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import DateSelector from "@/components/ui/inputs/DateSelector";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

/** Mirrors validatePassword in backend/src/utils/passwordValidation.ts. */
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One capital letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One small letter", test: (p) => /[a-z]/.test(p) },
  {
    label: "One symbol",
    test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Mirrors validatePhoneNumber on the User schema: bare 10 digits, or any
 *  country code in E.164. */
const PHONE_RE = /^(?:[6-9]\d{9}|\+\d{8,15})$/;
const PINCODE_RE = /^\d{6}$/;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
      {children}
    </h2>
  );
}

export type StaffRole = "marketer" | "sales";

const ROLE_COPY: Record<
  StaffRole,
  { title: string; noun: string; blurb: string }
> = {
  marketer: {
    title: "Create Marketer",
    noun: "marketer",
    blurb:
      "A marketer can open Scholarship campaigns and the CRM, and only sees campaigns and leads they or their ambassadors created.",
  },
  sales: {
    title: "Create Sales",
    noun: "sales user",
    blurb:
      "A sales user gets everything a marketer does, plus an inbox of the leads an admin assigns them to close.",
  },
};

export default function CreateStaffForm({ role }: { role: StaffRole }) {
  const copy = ROLE_COPY[role];
  const router = useRouter();
  const { uploadFile, deleteFile, validateImageFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState("");

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");

  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileImageS3Key, setProfileImageS3Key] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    ok: rule.test(password),
  }));
  const passwordStrong = passwordChecks.every((c) => c.ok);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleImageUpload = async (file: File) => {
    const validation = validateImageFile(file, MAX_IMAGE_BYTES);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      return;
    }
    setUploadingImage(true);
    try {
      // Replacing an image removes the previous object, so an abandoned upload
      // does not linger in the bucket.
      if (profileImageS3Key) await deleteFile(profileImageS3Key);
      const result = await uploadFile(file, "profile-images");
      if (result.success && result.data) {
        setProfileImageUrl(result.data.url);
        setProfileImageS3Key(result.data.s3Key);
        toast.success("Profile image uploaded");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (profileImageS3Key) {
      try {
        await deleteFile(profileImageS3Key);
      } catch {
        // A failed delete still clears the form; the object is orphaned at worst.
      }
    }
    setProfileImageUrl("");
    setProfileImageS3Key("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const firstProblem = (): string | null => {
    if (!firstName.trim()) return "First name is required";
    if (!email.trim()) return "Email is required";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address";
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      return "Phone must be 10 digits, optionally prefixed with +91";
    }
    if (whatsappNumber.trim() && !PHONE_RE.test(whatsappNumber.trim())) {
      return "WhatsApp number must be 10 digits, optionally prefixed with +91";
    }
    if (dob && dob.getTime() > Date.now()) {
      return "Date of birth cannot be in the future";
    }
    if (pincode.trim() && !PINCODE_RE.test(pincode.trim())) {
      return "Pincode must be 6 digits";
    }
    if (!passwordStrong) return "The password does not meet every rule below";
    if (password !== confirmPassword) return "The passwords do not match";
    return null;
  };

  const submit = async () => {
    const problem = firstProblem();
    if (problem) {
      toast.error(problem);
      return;
    }

    // Blank optionals are omitted, not sent as "": the server drops empties
    // anyway, and this keeps the payload honest about what was filled in.
    const address = {
      address: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      pincode: pincode.trim(),
    };
    const hasAddress = Object.values(address).some(Boolean);

    setSubmitting(true);
    try {
      await apiClient.post("/admin/staff/admins", {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        profilePicture: profileImageUrl || undefined,
        dob: dob ? dob.toISOString() : undefined,
        gender: gender || undefined,
        address: hasAddress ? address : undefined,
        password,
        role,
        // The server forces these roles' permissions empty regardless, since
        // the role is the grant.
        permissions: [],
      });
      toast.success(`${firstName.trim()} can now sign in as a ${copy.noun}`);
      router.push("/admin/users/manage-users");
    } catch (error) {
      toast.error(errorMessage(error, `Could not create the ${copy.noun}`));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          <Megaphone className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {copy.title}
          </h1>
          <p className="text-gray-600 mt-1">{copy.blurb}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <SectionHeading>Profile</SectionHeading>

          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt="Profile"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage
                    ? "Uploading…"
                    : profileImageUrl
                      ? "Replace photo"
                      : "Upload photo"}
                </WhiteButton>
                {profileImageUrl ? (
                  <button
                    type="button"
                    onClick={() => void removeImage()}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remove photo"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-gray-500">
                Optional. JPG or PNG, up to 5 MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              placeholder="Priya"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last name"
              placeholder="Sharma"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateSelector
              label="Date of birth"
              value={dob}
              onChange={setDob}
              maxDate={new Date()}
              placeholder="Select date of birth"
            />
            <Select
              label="Gender"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              value={gender}
              onChange={setGender}
              placeholder="Select gender"
            />
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <SectionHeading>Contact</SectionHeading>

          <Input
            label="Email"
            required
            type="email"
            placeholder="priya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            This becomes their sign-in address. It must not already have an
            account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="WhatsApp number"
              placeholder="9876543210"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>
        </section>

        {/* ── Address ─────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <SectionHeading>Address</SectionHeading>
          <p className="text-xs text-gray-500 -mt-2">
            Optional. Leave it blank and nothing is stored.
          </p>

          <Input
            label="Street address"
            placeholder="12 MG Road"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Bengaluru"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              placeholder="Karnataka"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Country"
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              label="Pincode"
              placeholder="560001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
        </section>

        {/* ── Sign-in ─────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <SectionHeading>Sign-in credentials</SectionHeading>

          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <Input
                label="Password"
                required
                type={showPassword ? "text" : "password"}
                placeholder="Set an initial password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[42px] text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Rules shown up front and ticked live, rather than surfacing one
                server rejection at a time after submit. */}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {passwordChecks.map((c) => (
                <li
                  key={c.label}
                  className={`text-xs flex items-center gap-1.5 ${
                    password.length === 0
                      ? "text-gray-400"
                      : c.ok
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      password.length === 0
                        ? "bg-gray-300"
                        : c.ok
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Confirm password"
              required
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter the password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="text-xs text-red-600">
                The passwords do not match.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <p className="text-sm text-gray-700">
              Share these credentials with the {copy.noun} directly. They can
              change the password from their profile, subject to the usual
              7-day change cooldown.
            </p>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <WhiteButton
            type="button"
            glow={false}
            disabled={submitting}
            onClick={() => router.push("/admin/users/manage-users")}
          >
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={submitting || uploadingImage}
            onClick={() => void submit()}
          >
            {submitting ? "Creating…" : `Create ${copy.noun}`}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
