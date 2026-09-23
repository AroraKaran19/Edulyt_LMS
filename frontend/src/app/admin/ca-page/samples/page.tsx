"use client";

import { useSectionState } from "../CaSettingsContext";
import { FieldGroup, SectionHeader } from "@/app/admin/settings/home-page/components/fields";
import MediaField from "@/app/admin/enquiry-page/components/MediaField";
import type { CaSamples } from "@/types/ca-page-settings";

const SAMPLE_ROWS: ReadonlyArray<{ key: keyof CaSamples; title: string }> = [
  { key: "offerLetter", title: "Offer letter" },
  { key: "lor", title: "Letter of recommendation" },
  { key: "internshipCertificate", title: "Internship certificate" },
  { key: "trainingCertificate", title: "Training certificate" },
];

const HELPER =
  "Empty keeps the letterhead shipped with the site. Upload a PNG or JPG render; SVG isn't accepted here.";

export default function SamplesSectionPage() {
  const { state, setState } = useSectionState("samples", (s) => ({
    offerLetter: s?.samples?.offerLetter ?? "",
    lor: s?.samples?.lor ?? "",
    internshipCertificate: s?.samples?.internshipCertificate ?? "",
    trainingCertificate: s?.samples?.trainingCertificate ?? "",
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Sample documents"
        description="The four letter images shown in the documents viewer."
      />

      <FieldGroup>
        {SAMPLE_ROWS.map((row) => (
          <MediaField
            key={row.key}
            title={row.title}
            description={HELPER}
            value={{ src: state[row.key] }}
            onChange={(m) =>
              setState((p) => ({ ...p, [row.key]: m.src ?? "" }))
            }
            folderName="ca-page/samples"
          />
        ))}
      </FieldGroup>
    </div>
  );
}
