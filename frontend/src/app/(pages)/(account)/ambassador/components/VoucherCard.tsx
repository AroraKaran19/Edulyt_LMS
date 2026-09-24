"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { useCaVoucher } from "@/hooks/useCaVouchers";
import type { CaVoucherCourseOption, CaVoucherMe, CaVoucherRequest } from "@/types/ca-voucher";
import { formatDate, formatTime } from "../deskTime";
import { CourseThumb, PLAN_LABEL, PlanPill } from "./VoucherBits";
import VoucherPicker from "./VoucherPicker";
import s from "../desk.module.css";

const when = (iso: string) => `${formatDate(iso, true)}, ${formatTime(iso)}`;

type Stamp = { label: string; className: string };

interface Props {
  voucher: CaVoucherMe;
  /** Shown as the ticket number when known. */
  voucherNo: string | null;
  onChange: (next: CaVoucherMe) => void;
}

export default function VoucherCard({ voucher, voucherNo, onChange }: Props) {
  const { getMe, requestCourse } = useCaVoucher();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { request, eligible, cooldownUntil } = voucher;

  const onRequest = async (course: CaVoucherCourseOption): Promise<boolean> => {
    const result = await requestCourse(course.id);
    if (!result.ok) {
      if (result.unavailable) {
        toast.error("This voucher can't be used right now.");
        setPickerOpen(false);
        const fresh = await getMe();
        if (fresh) onChange(fresh);
      } else {
        toast.error(result.message);
      }
      return false;
    }
    setPickerOpen(false);
    toast.success("Request sent");
    onChange({
      ...voucher,
      eligible: false,
      request: {
        id: request?.id ?? "",
        status: "pending",
        course: { id: course.id, title: course.title, thumbnail: course.thumbnail, slug: course.slug },
        plan: course.plan,
        declineReason: null,
        decidedAt: null,
      },
    });
    const fresh = await getMe();
    if (fresh) onChange(fresh);
    return true;
  };

  const chooseButton = (
    <OrangeButton className={cn(s.btn, s.btnOrange)} onClick={() => setPickerOpen(true)}>
      Choose your course
      <ArrowRight aria-hidden="true" />
    </OrangeButton>
  );

  let stamp: Stamp | null = null;
  let content: ReactNode;
  let action: ReactNode = null;

  if (request?.status === "pending") {
    stamp = { label: "REQUESTED", className: s.stampRequested };
    content = (
      <>
        <TicketCourse request={request} />
        <p className={s.ticketStatus}>Request sent. An admin will review it soon.</p>
      </>
    );
  } else if (request?.status === "approved") {
    stamp = { label: "REDEEMED", className: s.stampRedeemed };
    content = (
      <>
        <TicketCourse request={request}>
          <b>
            Unlocked: {request.course.title} ({PLAN_LABEL[request.plan]} plan)
          </b>
        </TicketCourse>
      </>
    );
    action = (
      <Link href={`/programs/${request.course.slug}/watch`} className={cn(s.btn, s.btnOrange)}>
        Start course
        <ArrowRight aria-hidden="true" />
      </Link>
    );
  } else if (request?.status === "declined") {
    if (!eligible) stamp = { label: "DECLINED", className: s.stampDeclined };
    content = (
      <>
        <TicketCourse request={request} />
        <p className={s.ticketStatus}>Your request was declined by the admin</p>
        {request.declineReason ? (
          <blockquote className={s.ticketReason}>
            <span className={s.srOnly}>Reason: </span>
            {request.declineReason}
          </blockquote>
        ) : null}
        <p className={s.ticketSub}>
          {eligible
            ? "You can pick a course again."
            : cooldownUntil
              ? `Contact them, or try again after ${when(cooldownUntil)}.`
              : "Contact them to find out more."}
        </p>
      </>
    );
    if (eligible) action = chooseButton;
  } else if (eligible) {
    content = (
      <>
        <p className={s.ticketSub}>Pick any Airkrit course. We&apos;ll unlock its Essential plan.</p>
        <ul className={s.ticketMetaRow}>
          <li>Any Airkrit course</li>
          <li>Essential plan</li>
          <li>One time</li>
        </ul>
      </>
    );
    action = chooseButton;
  } else {
    return null;
  }

  return (
    <section className={cn(s.section, s.voucherSection)} aria-labelledby="desk-voucher-title">
      <div className={s.ticketWrap}>
        <div className={cn(s.ticket, stamp && s.ticketStamped)}>
          <div className={s.ticketStub} aria-hidden="true">
            <span className={s.stubFree}>FREE</span>
            <span className={s.stubCourse}>1 course</span>
            <i className={s.stubBar} />
          </div>
          <div className={s.ticketMain}>
            {stamp ? (
              <span key={stamp.label} className={cn(s.stamp, stamp.className)} role="status">
                {stamp.label}
              </span>
            ) : null}
            <h2 id="desk-voucher-title" className={cn(s.display, s.ticketTitle)}>
              Your intern course voucher
            </h2>
            {content}
            {action || voucherNo ? (
              <div className={s.ticketFoot}>
                {action}
                {voucherNo ? <span className={s.ticketNo}>No. {voucherNo}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <VoucherPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onRequest={onRequest} />
    </section>
  );
}

function TicketCourse({ request, children }: { request: CaVoucherRequest; children?: ReactNode }) {
  return (
    <div className={s.ticketCourse}>
      <span className={s.ticketThumb}>
        <CourseThumb course={request.course} sizes="104px" />
      </span>
      <span className={s.ticketCourseText}>
        {children ?? (
          <>
            <b>{request.course.title}</b>
            <PlanPill plan={request.plan} />
          </>
        )}
      </span>
    </div>
  );
}
