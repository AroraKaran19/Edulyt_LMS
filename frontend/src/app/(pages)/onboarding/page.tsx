"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import useAuth from "@/hooks/useAuth";
import { Student } from "@/types";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { DEGREE_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/constants/profileOptions";
import { GraduationCap } from "lucide-react";

/**
 * Onboarding completion page. Students who are missing experience level, phone,
 * or degree are redirected here by the OnboardingGate. There is deliberately no
 * skip / close / back affordance — the only way forward is to save all three.
 */

/** Only allow a same-origin relative path as the post-save destination. */
function safeNext(value: string | null): string | null {
  if (!value) return null;
  let p = value.trim();
  try {
    p = decodeURIComponent(p);
  } catch {
    return null;
  }
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  // Never bounce back to onboarding itself.
  if (p === "/onboarding" || p.startsWith("/onboarding?")) return null;
  return p;
}

const OnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const { isLoading: authLoading, isAuthenticated, isUnauthenticated } =
    useAuth();

  const nextPath = useMemo(
    () => safeNext(searchParams.get("next")) ?? "/dashboard",
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState("");
  const [phone, setPhone] = useState("");
  // Degree dropdown selection ("Other" reveals the free-text field); degreeName
  // is the resolved value sent to the API.
  const [selectedDegree, setSelectedDegree] = useState("");
  const [degreeName, setDegreeName] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from the authoritative profile (a student may already have one or
  // two of the three fields).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/users/me");
        const profile = res.data?.data as Student | undefined;
        if (!mounted || !profile) return;
        setExperienceLevel(profile.experienceLevel || "");
        setPhone(profile.phone || "");
        const degree = profile.degreeName || "";
        setDegreeName(degree);
        if (degree) {
          const isPreset = DEGREE_OPTIONS.some((o) => o.value === degree);
          setSelectedDegree(isPreset ? degree : "Other");
        }
      } catch {
        // Ignore — start with empty fields.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!experienceLevel.trim()) {
      next.experienceLevel = "Please select your experience level";
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      next.phone = "Phone number must be exactly 10 digits";
    }
    if (!degreeName.trim()) {
      next.degreeName = "Please select or enter your course / degree";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await apiClient.put("/users/me", {
        experienceLevel: experienceLevel.trim(),
        phone: phone.trim(),
        degreeName: degreeName.trim(),
      });

      // Best-effort: mirror phone into the active session so pages reading from
      // useSession() see it without a reload. DB is the source of truth.
      try {
        await updateSession?.({ phone: phone.trim() });
      } catch {
        /* session sync is best-effort */
      }

      toast.success("Profile completed!");
      // Full navigation so the gate re-reads /users/me cleanly on the next page.
      window.location.href = nextPath;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message ||
          "Failed to save your details. Please try again.",
      );
      setSaving(false);
    }
  };

  // The OnboardingGate excludes /onboarding, so it never guards this route.
  // An unauthenticated visitor has no business here — render a real 404 rather
  // than the blank screen that `return null` produced.
  if (isUnauthenticated) notFound();

  if (authLoading || loading) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#f3f3f3]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500" />
      </div>
    );
  }

  // Auth status still resolving past the loader — render nothing as a safeguard.
  if (!isAuthenticated) return null;

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#f3f3f3] px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Complete your profile
          </h1>
          <p className="text-sm text-gray-600">
            We need a few details before you continue. All fields are required.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Experience Level */}
          <div className="flex flex-col gap-1">
            <Select
              label="Experience Level"
              labelClassName="text-base text-text-primary font-bold"
              placeholder="Select your experience level"
              required
              options={EXPERIENCE_LEVELS}
              searchable
              searchPlaceholder="Search..."
              value={experienceLevel}
              onChange={(value) => {
                setExperienceLevel(value);
                setErrors((p) => ({ ...p, experienceLevel: "" }));
              }}
              error={errors.experienceLevel || undefined}
            />
          </div>

          {/* Phone Number */}
          <Input
            label="Phone Number"
            labelClassName="text-base text-text-primary font-bold"
            placeholder="Enter your phone number"
            type="tel"
            required
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              // Digits only, hard-capped at 10 (guards paste too).
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              setErrors((p) => ({ ...p, phone: "" }));
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (
                [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(
                  e.keyCode,
                ) !== -1 ||
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)
              ) {
                return;
              }
              if (
                (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                (e.keyCode < 96 || e.keyCode > 105)
              ) {
                e.preventDefault();
              }
            }}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              const paste = e.clipboardData.getData("text");
              if (!/^\d+$/.test(paste)) {
                e.preventDefault();
              }
            }}
            error={errors.phone || undefined}
          />

          {/* Course / Degree Name */}
          <div className="flex flex-col gap-2">
            <Select
              label="Course / Degree Name"
              labelClassName="text-base text-text-primary font-bold"
              placeholder="Select your course / degree"
              required
              options={DEGREE_OPTIONS}
              searchable
              searchPlaceholder="Search degrees..."
              value={selectedDegree}
              onChange={(value) => {
                setSelectedDegree(value);
                setErrors((p) => ({ ...p, degreeName: "" }));
                // Preset value flows straight to degreeName; "Other" clears it
                // so the free-text field becomes the source.
                setDegreeName(value !== "Other" ? value : "");
              }}
              error={errors.degreeName || undefined}
            />
            {selectedDegree === "Other" && (
              <Input
                label="Specify Course / Degree"
                labelClassName="text-base text-text-primary font-bold"
                placeholder="Enter your course / degree name"
                value={degreeName}
                onChange={(e) => {
                  setDegreeName(e.target.value);
                  setErrors((p) => ({ ...p, degreeName: "" }));
                }}
                error={errors.degreeName || undefined}
              />
            )}
          </div>
        </div>

        <OrangeButton
          className="w-full text-base font-bold py-3 px-6 font-plus-jakarta"
          glow
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </OrangeButton>
      </div>
    </div>
  );
};

export default OnboardingPage;
