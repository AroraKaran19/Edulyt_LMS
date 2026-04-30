"use client";
import "quill/dist/quill.core.css";
import { Internship, InternshipEnrollmentListRow } from "@/types";
import Image from "next/image";
import {
  Check,
  DownloadIcon,
  Facebook,
  Instagram,
  Star,
  Youtube,
} from "lucide-react";
import WhiteButton2 from "@/components/ui/buttons/WhiteButton2";
import { cn } from "@/lib/utils";
import Link from "next/link";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { TelegramIcon, WhatsAppIcon } from "@/components/shared/Footer/Footer";
import {
  cloneElement,
  createElement,
  ElementType,
  isValidElement,
  ReactElement,
} from "react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import ApplyPathModal from "./ApplyPathModal";
import { getUpcomingBatch } from "@/lib/utils/internshipCohortDate";

/** Same internship as this page (by id or slug snapshot). */
function enrollmentMatchesInternship(
  row: InternshipEnrollmentListRow,
  internship: Internship,
): boolean {
  const iid = internship._id?.trim();
  if (iid && row.internship?._id && row.internship._id === iid) return true;
  const slug = internship.slug?.trim();
  if (!slug) return false;
  if (row.internship?.slug === slug) return true;
  if (row.internshipSnapshot?.slug === slug) return true;
  return false;
}

function scoreEnrollmentStatus(status: string): number {
  switch (status) {
    case "enrolled":
      return 100;
    case "paused":
      return 95;
    case "payment_pending":
      return 85;
    case "exam_registered":
    case "exam_attempted":
    case "in_merit_pool":
      return 70;
    case "completed":
      return 60;
    default:
      return 0;
  }
}

/**
 * If the learner may apply again (rejected / withdrawn), ignore those rows when a
 * newer enrollment exists for the same program.
 */
function pickEnrollmentForInternship(
  rows: InternshipEnrollmentListRow[],
  internship: Internship,
): InternshipEnrollmentListRow | null {
  const matches = rows.filter((r) =>
    enrollmentMatchesInternship(r, internship),
  );
  if (matches.length === 0) return null;
  const reapplyOk = new Set(["admin_rejected", "dropped", "revoked"]);
  const candidates = matches.filter((r) => !reapplyOk.has(r.status));
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) => scoreEnrollmentStatus(b.status) - scoreEnrollmentStatus(a.status),
  )[0];
}

type ApplyHint =
  | { kind: "apply" }
  | { kind: "replace"; label: string; href: string }
  /** Paid path: enrollment exists (`payment_pending`); resume Paytm checkout. */
  | { kind: "complete_payment" };

function applyHintForEnrollment(
  row: InternshipEnrollmentListRow | null,
  slug: string,
): ApplyHint {
  if (!row) return { kind: "apply" };
  const s = row.status;
  const dashHome = "/dashboard/internships";

  if (s === "enrolled") {
    return { kind: "replace", label: "You're enrolled", href: dashHome };
  }
  if (s === "paused") {
    return { kind: "replace", label: "Enrollment paused", href: dashHome };
  }
  if (s === "completed") {
    return { kind: "replace", label: "Program completed", href: dashHome };
  }
  if (s === "payment_pending") {
    return { kind: "complete_payment" };
  }
  if (
    s === "exam_registered" ||
    s === "exam_attempted" ||
    s === "in_merit_pool"
  ) {
    return {
      kind: "replace",
      label: "Already registered",
      href: s === "exam_registered" ? `${dashHome}/pending` : dashHome,
    };
  }
  return { kind: "apply" };
}

const InternshipHeader = ({ internship }: { internship: Internship }) => {
  const heroLines =
    internship.headerList?.map((s) => s?.trim()).filter(Boolean) ?? [];
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [resumePayLoading, setResumePayLoading] = useState(false);
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [myEnrollment, setMyEnrollment] = useState<
    InternshipEnrollmentListRow | null | undefined
  >(undefined);

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setMyEnrollment(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.internshipEnrollments.me, {
          params: { page: 1, limit: 80 },
        });
        const data = res.data?.data as
          | { enrollments?: InternshipEnrollmentListRow[] }
          | undefined;
        const rows = data?.enrollments ?? [];
        const picked = pickEnrollmentForInternship(rows, internship);
        if (!cancelled) setMyEnrollment(picked);
      } catch {
        if (!cancelled) setMyEnrollment(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, internship.slug, internship._id]);

  const applyHint = useMemo(
    () =>
      applyHintForEnrollment(
        myEnrollment === undefined ? null : myEnrollment,
        internship.slug,
      ),
    [myEnrollment, internship.slug],
  );

  const upcomingBatch = useMemo(
    () => getUpcomingBatch(internship.batches ?? []),
    [internship.batches],
  );

  /** Application / start rows: next upcoming cohort, or first batch if none upcoming. */
  const cohortForKeyDates = useMemo(() => {
    const list = internship.batches ?? [];
    return upcomingBatch ?? list[0] ?? null;
  }, [internship.batches, upcomingBatch]);

  const formatCohortDate = (value: Date | string | undefined) => {
    if (value == null) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const checkingEnrollment =
    sessionStatus === "authenticated" && myEnrollment === undefined;
  const sessionLoading = sessionStatus === "loading";

  const handleApplyPrimaryClick = async () => {
    if (sessionLoading) return;
    if (sessionStatus !== "authenticated") {
      const slugPath = `/internships/${encodeURIComponent(internship.slug)}`;
      const returnTo =
        pathname && pathname.startsWith("/") ? pathname : slugPath;
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (checkingEnrollment) return;
    if (applyHint.kind === "replace") {
      router.push(applyHint.href);
      return;
    }
    if (applyHint.kind === "complete_payment") {
      const eid = myEnrollment?._id;
      if (!eid) {
        toast.error("Could not find your registration. Refresh and try again.");
        return;
      }
      setResumePayLoading(true);
      try {
        const orderRes = await apiClient.post(
          ENDPOINTS.orders.createInternshipSeat,
          { internshipEnrollmentId: eid },
        );
        const order = orderRes.data?.data as
          | { _id: string; freeOrder?: boolean; token?: string }
          | undefined;
        if (!order) throw new Error("Could not start payment");
        if (order.freeOrder && order.token) {
          window.location.href = `/payment/status/${order._id}?token=${order.token}`;
          return;
        }
        window.location.href = `/paytm-redirect?orderId=${order._id}`;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ??
          (e instanceof Error ? e.message : "Could not start payment");
        toast.error(msg);
        setResumePayLoading(false);
      }
      return;
    }
    setApplyModalOpen(true);
  };

  const handleDownloadBrochure = async () => {
    try {
      if (!internship.brochure) return;
      const response = await fetch(internship.brochure);
      if (!response.ok) {
        throw new Error("Failed to fetch brochure");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${internship.title.toLowerCase().replace(/ /g, "-")}-brochure.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading brochure:", error);
    }
  };

  const handleDownloadJobDescription = async () => {
    try {
      if (!internship.jobDescription) return;
      const response = await fetch(internship.jobDescription);
      if (!response.ok) {
        throw new Error("Failed to fetch job description");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${internship.title.toLowerCase().replace(/ /g, "-")}-job-description.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading job description:", error);
    }
  };

  const socialLinks = [
    {
      label: "WhatsApp",
      href: "https://www.whatsapp.com/channel/0029VaIBXP347XeJjHqbNi1X",
      icon: WhatsAppIcon,
    },
    {
      label: "Telegram",
      href: "https://t.me/+_XxzFosKYOg2M2I9",
      icon: TelegramIcon,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/edulyt_india/",
      icon: Instagram,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/edulytindia/",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/people/Edulyt-India/100066801796718/",
      icon: Facebook,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@EdulytIndia",
      icon: Youtube,
    },
  ];

  return (
    <div className="internship-header relative from-primary/2 via-primary/4 to-secondary/15 bg-linear-to-tr w-full">
      <div className="absolute top-0 left-0 w-full h-full">
        <Image
          src="/internship/hero_bg.png"
          alt="Internship Header"
          width={1000}
          height={1000}
          className="w-full h-full object-cover opacity-10 select-none pointer-events-none"
          draggable={false}
          loading="eager"
          unoptimized
          priority
          quality={100}
        />
      </div>
      <div className="content relative z-10 w-full">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 py-10 lg:py-18 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
            <Image
              src={internship.thumbnail || "/internship/dummy.jpg"}
              alt={internship.title}
              width={1000}
              height={1000}
              className="w-full aspect-video max-h-[250px] object-cover object-center rounded-2xl select-none pointer-events-none"
              loading="eager"
              unoptimized
              priority
              quality={100}
              draggable={false}
            />
            <div className="internship-info-container flex flex-col gap-2 lg:gap-6">
              <h1 className="text-2xl lg:text-4xl font-bold text-text-primary text-wrap leading-none">
                {internship.title}
              </h1>
              {heroLines.length > 0 && (
                <ul
                  className="mt-4 flex flex-wrap gap-x-6 gap-y-4 list-none p-0 m-0"
                  aria-label="Program highlights"
                >
                  {heroLines.map((line, i) => (
                    <li key={i} className="flex shrink-0 items-center gap-2.5">
                      <span
                        className="flex size-5 p-0.5 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm"
                        aria-hidden
                      >
                        <Check
                          className="size-full text-white"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span className="text-base font-bold text-black">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div
                className={cn(
                  "internship-description ql-editor p-0! h-auto! min-h-0",
                  "text-lg font-medium text-text-primary max-w-none leading-relaxed",
                  "[&_p]:my-2 [&_p:first-child]:mt-0",
                  "[&_strong]:font-semibold",
                  "[&_a]:text-primary [&_a]:underline",
                )}
                style={
                  {
                    // Quill inline colors use var(--color-body); define for read-only HTML
                    ["--color-body" as string]:
                      "var(--color-text-primary, #2b1508)",
                  } as React.CSSProperties
                }
                dangerouslySetInnerHTML={{
                  __html: internship.description || "",
                }}
              />
            </div>
            {internship.brochure && internship.brochure !== "" && (
              <div className="mt-auto self-center lg:self-start">
                <WhiteButton2
                  glow={false}
                  onClick={handleDownloadBrochure}
                  className="text-primary font-bold text-base lg:text-lg flex items-center gap-2"
                >
                  <DownloadIcon className="size-6 text-primary" />
                  Download Brochure
                </WhiteButton2>
              </div>
            )}
            {internship.jobDescription && internship.jobDescription !== "" && (
              <div className="mt-auto self-center lg:self-start">
                <WhiteButton2
                  glow={false}
                  onClick={handleDownloadJobDescription}
                  className="text-primary font-bold text-base lg:text-lg flex items-center gap-2"
                >
                  <DownloadIcon className="size-6 text-primary" />
                  Download Job Description
                </WhiteButton2>
              </div>
            )}
            <div className="flex items-center gap-2 justify-start">
              <p
                className={cn(
                  "text-black text-sm lg:text-lg font-medium border-r border-gray-400 pr-2",
                  !internship.certification && "border-r-0",
                )}
              >
                {internship.analytics?.totalEnrollments || 1000}+ Students
                Trained
              </p>
              {internship.certification && (
                <p className="text-black text-sm lg:text-lg font-medium">
                  Certification Included
                </p>
              )}
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] w-full rounded-2xl px-5 py-6 overflow-auto flex flex-col">
              <table className="w-full [&_td]:p-2 lg:[&_td]:p-4">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">
                      Application Last Date
                    </td>
                    <td className="text-right">
                      <p className="inline-block p-1.5 px-2 lg:px-3 rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {formatCohortDate(
                          cohortForKeyDates?.applicationLastDate,
                        )}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">
                      Internship Start Date
                    </td>
                    <td className="text-right">
                      <p className="inline-block p-1.5 px-2 lg:px-3 rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {formatCohortDate(
                          cohortForKeyDates?.internshipStartDate,
                        )}
                      </p>
                    </td>
                  </tr>
                  {internship.whatsappGroupLink && (
                    <tr className="border-b border-gray-200">
                      <td className="text-xs lg:text-sm font-medium">
                        WhatsApp Link
                      </td>
                      <td className="text-right">
                        <div className="inline-block p-1.5 px-3 lg:px-4 rounded-full bg-[#59CC62] text-white text-xs lg:text-sm font-bold hover:bg-[#59CC62]/80 transition-all duration-300">
                          <Link
                            href={internship.whatsappGroupLink}
                            target="_blank"
                          >
                            Join Now!
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">
                      Certificate
                    </td>
                    <td className="text-right">
                      <div className="inline-block p-1.5 px-3 lg:px-4 rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {internship.certification ? "Yes" : "No"}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">Mode</td>
                    <td className="text-right">
                      <div className="inline-block p-1.5 px-3 lg:px-4 capitalize rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {internship.mode}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">
                      Upcoming batch
                    </td>
                    <td className="text-right">
                      <div className="inline-block p-1.5 px-3 lg:px-4 capitalize rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {formatCohortDate(upcomingBatch?.internshipStartDate)}
                      </div>
                    </td>
                  </tr>
                  {/* <tr className="border-b border-gray-200">
                    <td className="text-xs lg:text-sm font-medium">Rating</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1 p-1.5 px-3 lg:px-4 capitalize rounded-full bg-black/10 text-xs lg:text-sm font-normal">
                        {internship.analytics?.averageRating || 0}
                        <Star className="size-3 lg:size-4 fill-primary text-primary" />
                      </div>
                    </td>
                  </tr> */}
                </tbody>
              </table>
              <p className="text-xs lg:text-sm font-medium text-center mt-5">
                Follow us on social media
              </p>
              <div className="w-full mt-2 flex flex-wrap justify-center items-center gap-2.5">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary/80 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
                    aria-label={social.label}
                  >
                    {isValidElement(social.icon)
                      ? cloneElement(
                          social.icon as ReactElement<{ className?: string }>,
                          {
                            className: cn(
                              "w-[18px] h-[18px] text-current",
                              (
                                social.icon as ReactElement<{
                                  className?: string;
                                }>
                              ).props.className,
                            ),
                          },
                        )
                      : createElement(
                          social.icon as ElementType<{ className?: string }>,
                          { className: "w-[18px] h-[18px]" },
                        )}
                  </Link>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-2">
                <WhiteButton
                  glow={false}
                  className="w-full flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-medium">For Enquiry:</span>
                  <span className="text-sm font-medium">
                    Call us: +91 89292 52575
                  </span>
                </WhiteButton>
                <OrangeButton
                  glow={false}
                  className="w-full"
                  disabled={
                    sessionLoading || checkingEnrollment || resumePayLoading
                  }
                  onClick={() => void handleApplyPrimaryClick()}
                  aria-label={
                    applyHint.kind === "replace"
                      ? applyHint.label
                      : applyHint.kind === "complete_payment"
                        ? "Complete payment"
                        : sessionLoading
                          ? "Loading sign-in state"
                          : checkingEnrollment
                            ? "Checking enrollment status"
                            : "Apply now"
                  }
                >
                  {sessionLoading
                    ? "Loading…"
                    : checkingEnrollment
                      ? "Checking…"
                      : resumePayLoading
                        ? "Redirecting…"
                        : applyHint.kind === "replace"
                          ? applyHint.label
                          : applyHint.kind === "complete_payment"
                            ? "Complete payment"
                            : "Apply Now"}
                </OrangeButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ApplyPathModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        internshipSlug={internship.slug}
      />
    </div>
  );
};

export default InternshipHeader;
