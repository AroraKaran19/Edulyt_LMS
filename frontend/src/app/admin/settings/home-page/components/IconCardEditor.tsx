"use client";

import IconDropdown from "@/components/ui/dropdown/IconDropdown";
import type { IconOption } from "@/constants/internshipIcons";
import type { HomeIconTitleCard } from "@/types/home-page-settings";
import { TextAreaField, TextField } from "./fields";

export default function IconCardEditor({
  card,
  onChange,
  icons,
}: {
  card: HomeIconTitleCard;
  onChange: (next: HomeIconTitleCard) => void;
  icons: IconOption[];
}) {
  return (
    <>
      <TextField
        label="Title"
        value={card.title}
        onChange={(title) => onChange({ ...card, title })}
        placeholder="Industry-Driven Curriculum"
        required
      />
      <TextAreaField
        label="Description"
        value={card.description}
        onChange={(description) => onChange({ ...card, description })}
        placeholder="One-line description of this card."
        rows={3}
      />
      <IconDropdown
        label="Icon"
        value={card.icon || icons[0]?.name || ""}
        onChange={(icon) => onChange({ ...card, icon })}
        icons={icons}
      />
    </>
  );
}
