"use client";

import { cn } from "@/lib/utils";
import s from "../desk.module.css";

export interface TileValue {
  label: string;
  value: number | null;
  of?: number | null;
  /** Shown when value is null. */
  placeholder?: string;
}

export default function DeskTiles({ tiles }: { tiles: TileValue[] }) {
  return (
    <ul className={cn(s.tiles, tiles.length === 1 && s.tilesSolo)}>
      {tiles.map((t) => (
        <li key={t.label} className={s.tile}>
          {t.value === null ? (
            <span className={cn(s.num, s.numQuiet)}>{t.placeholder ?? "N/A"}</span>
          ) : (
            <span className={s.num}>
              {t.value}
              {t.of !== undefined && t.of !== null ? <em> / {t.of}</em> : null}
            </span>
          )}
          <small>{t.label}</small>
        </li>
      ))}
    </ul>
  );
}
