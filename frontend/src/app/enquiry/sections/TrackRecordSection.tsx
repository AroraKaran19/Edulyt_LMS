import { FOUNDED_YEAR } from "@/constants/company";
import { useSection } from "../settings";
import { CONTAINER, H2, LEAD, REVEAL, SECTION } from "./shared";

export default function TrackRecordSection() {
  const cms = useSection("trackRecord");

  return (
    <section className={SECTION} id="track-record">
      <div className={CONTAINER}>
        <div
          data-reveal
          className={`${REVEAL} mx-auto max-w-[52ch] text-center`}
        >
          <h2 className={H2}>
            {cms.heading || "Ten years,"}{" "}
            <em className="not-italic text-primary">
              {cms.headingHighlight || "not ten months"}
            </em>
          </h2>
          <p className={`${LEAD} mx-auto`}>
            {cms.lead ||
              `Airkrit has been training and placing students since ${FOUNDED_YEAR}. Long enough to know what a hiring manager actually asks, and to still be here when you need the referral.`}
          </p>
        </div>
      </div>
    </section>
  );
}
