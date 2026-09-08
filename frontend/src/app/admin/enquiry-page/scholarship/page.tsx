"use client";

import { useSectionState } from "../EnquirySettingsContext";
import {
  FieldGroup,
  SectionHeader,
} from "@/app/admin/settings/home-page/components/fields";
import { ENDPOINTS } from "@/constants/endpoints";
import ScholarshipAttachSelect, {
  useOwnCampaigns,
} from "@/components/admin/ScholarshipAttachSelect";

export default function ScholarshipSectionPage() {
  const { state, setState } = useSectionState("scholarship", (s) => ({
    testId: s?.scholarship?.testId ?? null,
  }));

  const { options, isLoading, failed } = useOwnCampaigns(
    ENDPOINTS.admin.enquiryScholarshipOptions,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SectionHeader
        title="Scholarship"
        description="Adds one line to the lead form, under the plan tiles, linking to a scholarship test."
      />

      <FieldGroup>
        <ScholarshipAttachSelect
          label="Scholarship on the main enquiry page"
          helperText="Only campaigns you created. This is for the bare /enquiry page: a visit carrying a marketer's or sales person's referral link shows their campaign instead, or none, and never this one."
          options={options}
          isLoading={isLoading}
          failed={failed}
          value={state.testId}
          onChange={(testId) => setState({ testId })}
        />
      </FieldGroup>
    </div>
  );
}
