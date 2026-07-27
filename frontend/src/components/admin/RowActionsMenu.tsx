"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RowActionTone =
  | "default"
  | "brand"
  | "warning"
  | "success"
  | "danger";

export type RowAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  tone?: RowActionTone;
  /** Draws a divider above this item — use it to fence off destructive actions. */
  separatorBefore?: boolean;
};

const TONE_STYLES: Record<RowActionTone, { item: string; icon: string }> = {
  default: { item: "text-gray-700 hover:bg-gray-50", icon: "text-gray-500" },
  brand: { item: "text-[#F77124] hover:bg-orange-50", icon: "text-[#F77124]" },
  warning: { item: "text-amber-700 hover:bg-amber-50", icon: "text-amber-600" },
  success: {
    item: "text-emerald-700 hover:bg-emerald-50",
    icon: "text-emerald-600",
  },
  danger: { item: "text-red-600 hover:bg-red-50", icon: "text-red-500" },
};

const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;

/**
 * Row-level action menu for admin tables. The menu renders in a portal and is
 * positioned from the trigger's rect, so it escapes the table's `overflow`
 * clipping and can flip above the trigger near the bottom of the viewport.
 */
const RowActionsMenu = ({
  actions,
  triggerLabel = "Actions",
  className,
}: {
  actions: RowAction[];
  triggerLabel?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const { offsetHeight: height, offsetWidth: width } = menu;

    let top = rect.bottom + MENU_GAP;
    if (top + height > window.innerHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, rect.top - height - MENU_GAP);
    }

    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.right - width),
      window.innerWidth - width - VIEWPORT_PADDING
    );

    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    // Coords survive a close on purpose: the menu unmounts, and this layout
    // effect re-measures before the next paint, so stale values never show.
    if (!isOpen) return;
    positionMenu();
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
      ?.focus();
  }, [isOpen, positionMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    // Capture phase so the table's own scroll container is heard too.
    window.addEventListener("scroll", positionMenu, true);
    window.addEventListener("resize", positionMenu);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", positionMenu, true);
      window.removeEventListener("resize", positionMenu);
    };
  }, [isOpen, positionMenu]);

  const moveFocus = (direction: 1 | -1) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      ) ?? []
    );
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      current === -1
        ? direction === 1
          ? 0
          : items.length - 1
        : (current + direction + items.length) % items.length;
    items[next]?.focus();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(-1);
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  };

  const select = (action: RowAction) => {
    setIsOpen(false);
    triggerRef.current?.focus();
    action.onSelect();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 cursor-pointer",
          "hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 transition-colors",
          isOpen && "bg-gray-50 text-gray-900",
          className
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={triggerLabel}
            onKeyDown={handleMenuKeyDown}
            style={{
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              // Keep it out of sight until measured, so it never flashes at 0,0.
              visibility: coords ? "visible" : "hidden",
            }}
            className="fixed z-50 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {actions.map((action) => {
              const tone = TONE_STYLES[action.tone ?? "default"];
              const Icon = action.icon;

              return (
                <div key={action.key}>
                  {action.separatorBefore && (
                    <div className="my-1 border-t border-gray-200" />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={() => select(action)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:bg-gray-100",
                      tone.item,
                      action.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", tone.icon)} />
                    {action.label}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

export default RowActionsMenu;
