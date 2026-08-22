import CertificateShowcase from "../components/CertificateShowcase";
import { CERTIFICATES, type Certificate } from "../plans";
import { listOr, useSection } from "../settings";
import { CONTAINER, EYEBROW, H2, LEAD, REVEAL, SECTION } from "./shared";

export default function CertificatesSection() {
  const cms = useSection("certificates");
  const certificates = listOr(
    cms.items as Certificate[] | undefined,
    CERTIFICATES,
  );

  return (
    <section className={SECTION} id="certificates">
      <div className={CONTAINER}>
        <div data-reveal className={REVEAL}>
          <span className={EYEBROW}>
            <i className="size-1.5 flex-none rounded-full bg-primary" />
            {cms.eyebrow || "Certificates"}
          </span>
          <h2 className={`${H2} mt-[18px]`}>
            {cms.heading || "The certificates and letters"}{" "}
            <em className="not-italic text-primary">
              {cms.headingHighlight || "you walk away with"}
            </em>
          </h2>
          <p className={LEAD}>
            {cms.lead ||
              "Every one of these is issued in your name and verifiable. Pick any on the right to see the real document."}
          </p>
        </div>

        <div data-reveal className={`${REVEAL} delay-[80ms]`}>
          <CertificateShowcase items={certificates} />
        </div>
      </div>
    </section>
  );
}
