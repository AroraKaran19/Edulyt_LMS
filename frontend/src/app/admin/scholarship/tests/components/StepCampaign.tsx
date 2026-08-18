"use client";

import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
};

export default function StepCampaign({
  title,
  setTitle,
  description,
  setDescription,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Campaign title"
        required
        placeholder="e.g. Diwali scholarship test"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="text-xs text-gray-500 -mt-2">
        The public URL is derived from this and cannot be changed later.
      </p>

      <TextArea
        label="Public description"
        placeholder="Shown to candidates on the campaign page (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <p className="text-sm text-gray-700">
          Everyone who finishes the test gets the coupon. It works on any course,
          and each winner can redeem it once.
        </p>
      </div>
    </div>
  );
}
