"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, UserPlus, X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import PartnerAnalyticsToggles from "./PartnerAnalyticsToggles";
import { toast } from "react-toastify";
import useUserManagement from "@/hooks/useUserManagement";
import {
  validatePassword,
  getPasswordRequirementsText,
} from "@/lib/passwordValidation";

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fires after a successful create so the parent can refresh the user list. */
  onCreated?: () => void;
}

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  /** Stores the College _id from the main directory — the dropdown surfaces
   *  the human-readable "Name, Location" string in `collegeDisplay`, but the
   *  payload uses the id so renames/deletes don't desync the link. */
  partnerCollegeId: string;
  collegeDisplay: string;
  courseAnalyticsEnabled: boolean;
  internshipAnalyticsEnabled: boolean;
};

const EMPTY_FORM: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  partnerCollegeId: "",
  collegeDisplay: "",
  courseAnalyticsEnabled: true,
  internshipAnalyticsEnabled: true,
};

export default function AddPartnerModal({
  isOpen,
  onClose,
  onCreated,
}: AddPartnerModalProps) {
  const { createPartnerAccount, isLoading } = useUserManagement();
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state every time the modal is closed so a re-open starts clean.
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setShowPassword(false);
    }
  }, [isOpen]);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim()) return toast.error("First name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.partnerCollegeId.trim())
      return toast.error("Pick a college from the directory");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");

    const pwErrors = validatePassword(form.password);
    const firstPwError = Object.values(pwErrors)[0];
    if (firstPwError) {
      return toast.error(firstPwError);
    }

    const result = await createPartnerAccount({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      partnerCollegeId: form.partnerCollegeId.trim(),
      courseAnalyticsEnabled: form.courseAnalyticsEnabled,
      internshipAnalyticsEnabled: form.internshipAnalyticsEnabled,
    });

    if (result) {
      toast.success("Partner account created");
      onCreated?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-orange-100 text-orange-600">
              <UserPlus className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Partner Account
              </h2>
              <p className="text-xs text-gray-500">
                College-side partner portal user
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              required
              placeholder="Jane"
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Doe"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
              placeholder="partner@college.edu"
              startAdornment={<Mail className="size-4 text-gray-400" />}
            />
            <Input
              label="Phone (Optional)"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="Optional"
              startAdornment={<Phone className="size-4 text-gray-400" />}
            />
          </div>

          <CollegeSelect
            label="College *"
            placeholder="Search and pick from the directory"
            value={form.collegeDisplay}
            disallowCustom
            onChange={() => {
              /* Custom text is disabled via disallowCustom — picks only.
               *  Server-side validator requires an existing College _id. */
            }}
            onSelect={(c) => {
              setField("partnerCollegeId", c._id);
              setField("collegeDisplay", c.display);
            }}
          />

          <div className="mt-4">
            <PartnerAnalyticsToggles
              courseAnalyticsEnabled={form.courseAnalyticsEnabled}
              internshipAnalyticsEnabled={form.internshipAnalyticsEnabled}
              onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              placeholder="Set a strong password"
              startAdornment={<Lock className="size-4 text-gray-400" />}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
            />
            <Input
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              required
              placeholder="Re-enter password"
              startAdornment={<Lock className="size-4 text-gray-400" />}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {getPasswordRequirementsText()}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <WhiteButton type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </WhiteButton>
            <OrangeButton type="submit" glow={false} disabled={isLoading}>
              {isLoading ? "Creating…" : "Create Partner"}
            </OrangeButton>
          </div>
        </form>
      </div>
    </div>
  );
}
