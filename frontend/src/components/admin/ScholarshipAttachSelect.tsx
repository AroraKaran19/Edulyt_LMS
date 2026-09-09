"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";
import Select, { type SelectOption } from "@/components/ui/inputs/Select";

export interface CampaignOption {
  _id: string;
  title: string;
  slug: string;
  isActive: boolean;
}

/**
 * The caller's own campaigns.
 *
 * Both endpoints that serve this are hard-scoped to the signed-in user, so
 * "own" is settled server side and this never has to filter.
 */
export function useOwnCampaigns(endpoint: string) {
  const [options, setOptions] = useState<CampaignOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(endpoint);
      setOptions(res.data?.data?.items ?? []);
      setFailed(false);
    } catch {
      // Tracked rather than swallowed: an empty list and a failed request look
      // identical otherwise, and the picker would claim you have no campaigns.
      setFailed(true);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { options, isLoading, failed, reload };
}

/**
 * Picks one campaign to advertise on an enquiry link.
 *
 * A paused campaign stays in the list and is labelled: attaching one is legal,
 * it simply renders nothing until it is resumed. A stored id that is missing
 * from the list belonged to a campaign that has since been deleted, which the
 * note below calls out rather than silently showing an empty box.
 */
export default function ScholarshipAttachSelect({
  label,
  helperText,
  options,
  value,
  onChange,
  disabled,
  isLoading,
  failed,
}: {
  label: string;
  helperText: string;
  options: CampaignOption[];
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  failed?: boolean;
}) {
  const NONE = "";
  const selectOptions: SelectOption[] = [
    { value: NONE, label: "No scholarship" },
    ...options.map((c) => ({
      value: c._id,
      label: c.isActive ? c.title : `${c.title} (paused)`,
    })),
  ];

  // Only once the list has actually arrived: mid-load, and on a failed load,
  // every id looks missing and the note would call a live campaign deleted.
  const dangling =
    !isLoading &&
    !failed &&
    Boolean(value) &&
    !options.some((c) => c._id === value);

  return (
    <div>
      <Select
        label={label}
        options={selectOptions}
        value={dangling ? NONE : (value ?? NONE)}
        placeholder={isLoading ? "Loading campaigns…" : "No scholarship"}
        disabled={disabled || isLoading}
        searchable={options.length > 8}
        onChange={(next) => onChange(next || null)}
      />
      <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      {dangling && (
        <p className="mt-1 text-xs text-amber-700">
          The campaign that was attached here no longer exists. Nothing is shown
          on the page; pick another or save to clear it.
        </p>
      )}
      {failed && (
        <p className="mt-1 text-xs text-amber-700">
          Could not load your campaigns. Reload the page to try again.
        </p>
      )}
      {!isLoading && !failed && options.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">
          You have not created any scholarship campaigns yet.
        </p>
      )}
    </div>
  );
}
