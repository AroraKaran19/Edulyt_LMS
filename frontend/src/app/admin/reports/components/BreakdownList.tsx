"use client";

/**
 * Compact label/value list for a row's sub-totals. Zero components are hidden
 * so the cell shows only where the points actually came from.
 */
export default function BreakdownList({
  entries,
}: {
  entries: [label: string, value: number][];
}) {
  const shown = entries.filter(([, v]) => v > 0);
  if (shown.length === 0) return <span className="text-gray-300">—</span>;
  return (
    <ul className="space-y-0.5">
      {shown.map(([label, value]) => (
        <li key={label} className="flex justify-between gap-3">
          <span className="text-gray-500">{label}</span>
          <span className="tabular-nums">{value.toLocaleString("en-IN")}</span>
        </li>
      ))}
    </ul>
  );
}
