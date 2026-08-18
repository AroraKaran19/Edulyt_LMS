import { BadgeCheck, Crown, Plus } from "lucide-react";
import CertificateShowcase from "../CertificateShowcase";
import {
  AVAILABILITY,
  CERTIFICATES,
  MNC_ADDON_PRICE,
  type Availability,
} from "../plans";
import { CARD, CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

const titlesFor = (availability: Availability) =>
  CERTIFICATES.filter((c) => c.availability === availability).map(
    (c) => c.title
  );

const GROUPS = [
  {
    icon: BadgeCheck,
    label: "On every plan",
    accent: "text-[#2c7f34]",
    tint: "bg-[#3aa544]/[0.09]",
    items: titlesFor(AVAILABILITY.everyPlan),
  },
  {
    icon: Crown,
    label: "Plan 03 only",
    accent: "text-[#c4551a]",
    tint: "bg-primary/10",
    items: titlesFor(AVAILABILITY.topPlan),
  },
  {
    icon: Plus,
    label: "MNC certification",
    accent: "text-[#8c7a70]",
    tint: "bg-[#8c7a70]/10",
    items: [
      `Any 1 of ${titlesFor(AVAILABILITY.mnc).length}, free on Plan 03`,
      `+₹${MNC_ADDON_PRICE.toLocaleString("en-IN")} on the other plans`,
    ],
  },
];

export default function CertificatesSection() {
  return (
    <section className={SECTION} id="certificates">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            Certificates
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            The certificates and letters{" "}
            <em className="not-italic text-primary">you walk away with</em>
          </h2>
          <p className={LEAD}>
            Every one of these is issued in your name and verifiable. Pick any
            on the right to see the real document.
          </p>

          <div className={`${CARD} mt-6 overflow-hidden`}>
            <p className="border-b border-[#fbe3d2] bg-[#fffaf7] px-5 py-3 text-[13px] font-bold text-text-primary">
              Clear the programme goals and most of it is yours whichever plan
              you pick.
            </p>
            <dl className="grid divide-y divide-[#fbe3d2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {GROUPS.map(({ icon: Icon, label, accent, tint, items }) => (
                <div key={label} className="px-5 py-[18px]">
                  <dt className="flex items-center gap-2">
                    <span
                      className={`grid size-6 flex-none place-items-center rounded-full ${tint} ${accent}`}
                    >
                      <Icon size={13} strokeWidth={2.8} />
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8c7a70]">
                      {label}
                    </span>
                  </dt>
                  <dd className="mt-2.5 space-y-1.5">
                    {items.map((item) => (
                      <p
                        key={item}
                        className="text-[13px] leading-[1.45] font-semibold text-text-primary"
                      >
                        {item}
                      </p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div data-reveal className={`${REVEAL} delay-[80ms]`}>
          <CertificateShowcase />
        </div>
      </div>
    </section>
  );
}
