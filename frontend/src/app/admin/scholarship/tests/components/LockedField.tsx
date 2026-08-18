import { Lock } from "lucide-react";

/**
 * Read-only row for fields that cannot change after creation. Mirrors the same
 * treatment in the internship exam upsert modal.
 */
export default function LockedField({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Lock className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 select-none">
        {value === undefined || value === "" ? (
          <span className="italic text-gray-400">Not set</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
