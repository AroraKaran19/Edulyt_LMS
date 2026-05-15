"use client";

interface Props {
  courseAnalyticsEnabled: boolean;
  internshipAnalyticsEnabled: boolean;
  onChange: (next: {
    courseAnalyticsEnabled: boolean;
    internshipAnalyticsEnabled: boolean;
  }) => void;
}

/** Two checkboxes that gate the partner portal's Courses / Internships pages. */
export default function PartnerAnalyticsToggles({
  courseAnalyticsEnabled,
  internshipAnalyticsEnabled,
  onChange,
}: Props) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-gray-900">
        Analytics Access
      </h4>
      <p className="mb-3 text-xs text-gray-500">
        Controls which analytics pages this partner sees in their portal.
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={courseAnalyticsEnabled}
            onChange={(e) =>
              onChange({
                courseAnalyticsEnabled: e.target.checked,
                internshipAnalyticsEnabled,
              })
            }
            className="size-4 accent-[#F77124]"
          />
          Course Analytics
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={internshipAnalyticsEnabled}
            onChange={(e) =>
              onChange({
                courseAnalyticsEnabled,
                internshipAnalyticsEnabled: e.target.checked,
              })
            }
            className="size-4 accent-[#F77124]"
          />
          Internship Analytics
        </label>
      </div>
    </div>
  );
}
