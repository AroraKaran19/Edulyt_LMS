"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import type { CaReferralLeadsPage } from "@/types/ca-desk";
import { formatDate } from "../deskTime";
import s from "../desk.module.css";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

interface Props {
  data: CaReferralLeadsPage | null;
  failed: boolean;
  busy: boolean;
  onPage: (page: number) => void;
  onRetry: () => void;
}

export default function DeskLeads({ data, failed, busy, onPage, onRetry }: Props) {
  let body: ReactNode;

  if (failed && !data) {
    body = (
      <div className={s.empty} role="alert">
        <span className={cn(s.emptyIc, s.errorIc)}>
          <AlertCircle aria-hidden="true" />
        </span>
        <h3>We couldn&apos;t load your enquiries</h3>
        <p>Check your connection and try again.</p>
        <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={onRetry} disabled={busy}>
          Try again
        </WhiteButton>
      </div>
    );
  } else if (!data || data.total === 0) {
    body = (
      <div className={s.empty}>
        <span className={s.emptyIc}>
          <Inbox aria-hidden="true" />
        </span>
        <h3>No enquiries yet. Share your link to get started.</h3>
        <p>Everyone who fills in the enquiry form through your link shows up here.</p>
      </div>
    );
  } else {
    body = (
      <>
        <table className={cn(s.leads, busy && s.leadsBusy)} aria-busy={busy}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Programme</th>
              <th scope="col">College</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <span className={s.leadName}>
                    <span className={s.avatar} aria-hidden="true">
                      {initials(lead.name)}
                    </span>
                    <span className={s.clamp2} title={lead.name}>{lead.name || "Name not given"}</span>
                  </span>
                </td>
                <td>
                  <span className={s.clamp2} title={lead.programme ?? undefined}>
                    {lead.programme || "Not specified"}
                  </span>
                </td>
                <td>
                  <span className={s.clamp2} title={lead.college ?? undefined}>
                    {lead.college || "Not specified"}
                  </span>
                </td>
                <td className={s.leadDate}>
                  <time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={onPage}
          disabled={busy}
          windowSize={3}
          className={cn(s.deskPager, s.leadsPager)}
        />
      </>
    );
  }

  return (
    <section className={s.section} aria-labelledby="desk-leads-title">
      <h2 id="desk-leads-title" className={cn(s.display, s.h2)}>
        People who came through your link
      </h2>
      <p className={s.sub}>Everyone who sent an enquiry with your code.</p>
      <div className={cn(s.card, s.leadsCard)}>{body}</div>
      <p className={s.note}>Your team leader follows up with each of them and can tell you how they are getting on.</p>
    </section>
  );
}
