"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/inputs/Select";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import useCaApplications from "@/hooks/useCaApplications";
import { AMBASSADOR_KIND_LABELS, type AmbassadorKind } from "@/hooks/useCrm";
import type { CaApplicationRow, CaAttachOutcome, CaOwner } from "@/types/ca-application";

const KINDS: AmbassadorKind[] = ["marketing", "social-media"];

const DEFAULT_DESIGNATIONS: Record<AmbassadorKind, string> = {
  marketing: "Campus Ambassador (Marketing Intern)",
  "social-media": "Campus Ambassador (Social Media Marketing Intern)",
};

interface Props {
  application: CaApplicationRow | null;
  isOwner: boolean;
  owners: CaOwner[];
  onClose: () => void;
  onSuccess: (application: CaApplicationRow, outcome: CaAttachOutcome) => void;
  /** Called when the request fails (e.g. someone else already decided this
   *  row), so the caller can refresh the list instead of leaving it stale. */
  onFailed?: () => void;
}

export default function ApproveCaModal({
  application,
  isOwner,
  owners,
  onClose,
  onSuccess,
  onFailed,
}: Props) {
  const { approve, isLoading } = useCaApplications();
  // The caller keys this component by `application?.id`, so a new target
  // mounts a fresh instance instead of needing an effect to reset these.
  const [ownerUserId, setOwnerUserId] = useState(() => application?.referrer?.userId ?? "");
  const [kind, setKind] = useState<AmbassadorKind | "">("");
  const [designations, setDesignations] = useState<Record<AmbassadorKind, string>>(
    DEFAULT_DESIGNATIONS,
  );
  const [designationsFailed, setDesignationsFailed] = useState(false);

  useEffect(() => {
    if (isOwner || !application) return;
    let cancelled = false;
    apiClient
      .get(ENDPOINTS.admin.caPageSettings)
      .then((res) => {
        if (cancelled) return;
        const found = res.data?.data?.documents?.designations;
        setDesignations({
          marketing: found?.marketing || DEFAULT_DESIGNATIONS.marketing,
          "social-media": found?.["social-media"] || DEFAULT_DESIGNATIONS["social-media"],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDesignations(DEFAULT_DESIGNATIONS);
        setDesignationsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, application]);

  if (!application) return null;

  // The Select can only offer what `owners` holds, so a preset id it doesn't
  // contain (an inactive referrer, or `owners()` still loading) must not let
  // the admin submit a team the control isn't actually showing.
  const canSubmit =
    Boolean(kind) && (isOwner || (Boolean(ownerUserId) && owners.some((o) => o.userId === ownerUserId)));
  const verb = isOwner ? "Accept" : "Approve";

  const onConfirm = async () => {
    if (!canSubmit || !kind) return;
    const result = await approve(application.id, kind, isOwner ? undefined : ownerUserId);
    if (result) onSuccess(result.application, result.outcome);
    else onFailed?.();
  };

  return (
    <Modal isOpen onClose={onClose} title={`${verb} ${application.name}`}>
      <div className="space-y-4">
        {isOwner ? (
          <div className="rounded-xl border border-gray-200 px-3.5 py-3 text-sm">
            <div className="text-xs font-semibold text-gray-500">Team</div>
            <div className="mt-0.5 font-medium text-gray-900">Your team</div>
          </div>
        ) : (
          <Select
            label="Team"
            required
            dropdownPortal
            options={owners.map((o) => ({ value: o.userId, label: o.name }))}
            value={ownerUserId}
            onChange={setOwnerUserId}
            placeholder="Choose a marketer or sales person"
          />
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Kind <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {KINDS.map((k) => (
              <label
                key={k}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
                  kind === k
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="ca-kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  className="mt-0.5 size-4 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {AMBASSADOR_KIND_LABELS[k]}
                  </span>
                  {!isOwner && !designationsFailed ? (
                    <span className="mt-0.5 block text-xs text-gray-500">
                      Offer letter designation: {designations[k]}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Their offer letter is generated and emailed to {application.email}, with the WhatsApp
          group link.
        </p>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <WhiteButton type="button" glow={false} disabled={isLoading} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={!canSubmit || isLoading}
            onClick={() => void onConfirm()}
          >
            {isLoading
              ? "Sending…"
              : `${verb} and send offer letter`}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
