import { Copy } from "lucide-react";

interface CopyIdRowProps {
  label: string;
  value: string | undefined | null;
  copyLabel: string;
  onCopy: (label: string, value: string) => void;
}

export function CopyIdRow({ label, value, copyLabel, onCopy }: CopyIdRowProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-start gap-2 font-mono text-xs break-all">
        <span>
          {value || <span className="text-gray-400">—</span>}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onCopy(copyLabel, value)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 shrink-0"
            title={`Copy ${label}`}
          >
            <Copy className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
