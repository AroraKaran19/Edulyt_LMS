import { BadgeCheck, Crown, Plus } from "lucide-react";
import PlanMatrix from "../PlanMatrix";
import {
  AVAILABILITY,
  CERTIFICATES,
  type Availability,
  type Certificate,
  type PlanId,
} from "../plans";
import { listOr, useSection } from "../settings";
import { usePlanData } from "../usePlanData";
import {
  CARD,
  CONTAINER,
  EYEBROW,
  H2,
  LEAD,
  REVEAL,
  SECTION,
} from "./shared";

type Props = {
  plan: PlanId;
  onPlan: (id: PlanId) => void;
  cert: string | null;
  onCert: (cert: string | null) => void;
};

/**
 * Derived from each certificate's `availability`, not authored separately, so
 * this can never disagree with the certificate list it summarises.
 */
const buildGroups = (items: Certificate[], addonPrice: number) => {
  const titlesFor = (availability: Availability) =>
    items.filter((c) => c.availability === availability).map((c) => c.title);

  return [
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
        `+₹${addonPrice.toLocaleString("en-IN")} on the other plans`,
      ],
    },
  ];
};

export default function PlansSection({ plan, onPlan, cert, onCert }: Props) {
  const cms = useSection("plans");
  const { mncAddonPrice } = usePlanData();
  // The certificate list still lives with the certificates section; only the
  // summary of it moved here.
  const certificates = listOr(
    useSection("certificates").items as Certificate[] | undefined,
    CERTIFICATES,
  );
  const groups = buildGroups(certificates, mncAddonPrice);

  return (
    <section className={SECTION} id="plans">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            {cms.eyebrow || "Compare the plans"}
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            {cms.heading || "Everything we offer, and"}{" "}
            <em className="not-italic text-primary">
              {cms.headingHighlight || "what each plan unlocks"}
            </em>
          </h2>
          <p className={LEAD}>
            {cms.lead ||
              "Pick a plan on the right. The list lights up with what you get and dims what you do not. The MNC certification is free on Mentor-to-Placement and can be added to either other plan."}
          </p>

          <div className={`${CARD} mt-6 overflow-hidden`}>
            <p className="border-b border-[#fbe3d2] bg-[#fffaf7] px-5 py-3 text-[13px] font-bold text-text-primary">
              {cms.summaryHeader ||
                "Clear the programme goals and most of it is yours whichever plan you pick."}
            </p>
            <dl className="grid divide-y divide-[#fbe3d2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {groups.map(({ icon: Icon, label, accent, tint, items }) => (
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
          <PlanMatrix
            selected={plan}
            onSelect={onPlan}
            cert={cert}
            onCert={onCert}
          />
        </div>
      </div>
    </section>
  );
}
