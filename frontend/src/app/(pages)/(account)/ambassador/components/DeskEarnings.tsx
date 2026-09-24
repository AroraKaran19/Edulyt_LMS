"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import { DEFAULT_KIT_ITEMS, inr, inrShort, kitList, money } from "@/app/digital-marketing-internship/content";
import s from "../desk.module.css";

export default function DeskEarnings({ settings }: { settings: CaPageSettings }) {
  const m = money(settings);
  const kit = kitList(settings.kit.items.length ? settings.kit.items : DEFAULT_KIT_ITEMS);

  const rows: {
    what: string;
    note: string;
    credit: string;
    unit: string;
    condition?: string;
  }[] = [
    {
      what: "Fixed stipend",
      note: "Paid to your UPI ID every month",
      credit: inr(m.stipend),
      unit: "per month",
      condition:
        "Promote Airkrit on college campuses to generate 10 qualified leads that successfully convert into sales.",
    },
    {
      what: "Performance incentive",
      note: "For the admissions your link brings in",
      credit: inr(m.incentiveCap),
      unit: "up to, per month",
    },
    { what: "Joining kit", note: kit.charAt(0).toUpperCase() + kit.slice(1), credit: inr(m.kitValue), unit: "worth" },
    { what: "1 year of LMS access", note: "Every course on Airkrit", credit: inrShort(m.lmsValue), unit: "worth" },
    {
      what: "A shot at a full-time offer",
      note: "Pre-placement offer for top ambassadors",
      credit: `${m.ppoPackageLpa} LPA`,
      unit: "package",
    },
    {
      what: "Letter of recommendation and certificates",
      note: "Internship and training certificates at the end",
      credit: "3",
      unit: "documents",
    },
  ];

  return (
    <section className={s.section} aria-labelledby="desk-earnings-title">
      <h2 id="desk-earnings-title" className={cn(s.display, s.h2)}>
        What you are earning
      </h2>
      <p className={s.sub}>Everything that comes with being an Airkrit Marketing Intern / Digital Marketing Intern.</p>
      <div className={s.sheet}>
        <div className={s.sheetHead}>
          <p className={s.sheetName}>How it works for YOU</p>
          <p className={s.sheetRole}>Marketing Intern / Digital Marketing Intern</p>
        </div>
        <table className={s.ledger}>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.what}>
                <tr>
                  <td className={s.what}>
                    <b>{r.what}</b>
                    <span>{r.note}</span>
                  </td>
                  <td className={s.credit}>
                    {r.credit}
                    <small>{r.unit}</small>
                  </td>
                </tr>
                {r.condition ? (
                  <tr className={s.conditionRow}>
                    <td colSpan={2}>
                      <p className={s.condition}>{r.condition}</p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        <div className={s.total}>
          <b>A top month</b>
          <span className={s.num}>{inr(m.stipend + m.incentiveCap)}</span>
        </div>
      </div>
    </section>
  );
}
