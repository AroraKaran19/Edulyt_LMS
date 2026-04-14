import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Icon } from "@iconify/react";

interface IconOption {
  name: string;
  label: string;
}

interface IconDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  icons: IconOption[];
  iconColor?: string;
  hoverColor?: string;
}

const IconDropdown = ({
  value,
  onChange,
  label,
  required,
  error,
  icons,
  iconColor = "text-orange-500",
  hoverColor = "hover:bg-orange-50 bg-orange-100 text-orange-700",
}: IconDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIcon = icons.find((icon) => icon.name === value) || icons[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all flex items-center justify-between ${
          error ? "border-red-300" : "border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon icon={selectedIcon.name} className={`size-5 ${iconColor}`} />
          <span className="text-sm text-gray-900">{selectedIcon.label}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-gray-400" />
        ) : (
          <ChevronDown className="size-4 text-gray-400" />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-1 p-2">
              {icons.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => {
                    onChange(icon.name);
                    setIsOpen(false);
                  }}
                  className={`flex items-center cursor-pointer gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                    value === icon.name
                      ? hoverColor.split(" ").slice(1).join(" ")
                      : `text-gray-700 ${hoverColor.split(" ")[0]}`
                  }`}
                >
                  <Icon
                    icon={icon.name}
                    className={`size-5 shrink-0 ${iconColor}`}
                  />
                  <span className="truncate">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default IconDropdown;
