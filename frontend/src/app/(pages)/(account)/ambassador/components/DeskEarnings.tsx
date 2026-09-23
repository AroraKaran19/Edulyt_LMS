"use client";

import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import { DEFAULT_KIT_ITEMS, inr, inrShort, kitList, money } from "@/app/campus-ambassador/content";
import s from "../desk.module.css";

export default function DeskEarnings({ settings }: { settings: CaPageSettings }) {
  const m = money(settings);
  const kit = kitList(settings.kit.items.length ? settings.kit.items : DEFAULT_KIT_ITEMS);

  const rows = [
    { what: "Fixed stipend", note: "Paid to your UPI ID every month", credit: inr(m.stipend), unit: "per month" },
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
      <p className={s.sub}>Everything that comes with being an Airkrit Campus Ambassador.</p>
      <div className={s.sheet}>
        <table className={s.ledger}>
          <tbody>
            {rows.map((r) => (
              <tr key={r.what}>
                <td className={s.what}>
                  <b>{r.what}</b>
                  <span>{r.note}</span>
                </td>
                <td className={s.credit}>
                  {r.credit}
                  <small>{r.unit}</small>
                </td>
              </tr>
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
