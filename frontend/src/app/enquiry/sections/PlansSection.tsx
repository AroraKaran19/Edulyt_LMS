import PlanMatrix from "../PlanMatrix";
import type { PlanId } from "../plans";
import { CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

type Props = {
  plan: PlanId;
  onPlan: (id: PlanId) => void;
  cert: string | null;
  onCert: (cert: string | null) => void;
};

export default function PlansSection({ plan, onPlan, cert, onCert }: Props) {
  return (
    <section className={SECTION} id="plans">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            Compare the plans
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            Everything we offer, and{" "}
            <em className="not-italic text-primary">what each plan unlocks</em>
          </h2>
          <p className={LEAD}>
            Pick a plan on the right. The list lights up with what you get and
            dims what you do not. The MNC certification is free on
            Mentor-to-Placement and can be added to either other plan.
          </p>
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
