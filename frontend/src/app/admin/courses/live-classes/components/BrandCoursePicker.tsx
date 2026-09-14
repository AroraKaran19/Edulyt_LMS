"use client";

import React, { useState } from "react";
import CoursePicker from "./CoursePicker";
import BrandSelect from "@/components/admin/BrandSelect";
import type { Brand } from "@/constants/brands";

type Props = React.ComponentProps<typeof CoursePicker>;

/** Brand first, then a course from it. For creating things, not for filters. */
const BrandCoursePicker: React.FC<Props> = (props) => {
  const [brand, setBrand] = useState<Brand | "">("");

  return (
    <div className="flex flex-col gap-3">
      <BrandSelect
        required={props.required}
        placeholder="Choose a brand first"
        value={brand}
        onChange={(next) => {
          if (next === "all" || next === brand) return;
          setBrand(next);
          props.onChange("", "");
        }}
      />
      <CoursePicker {...props} brand={brand} disabled={props.disabled || !brand} />
    </div>
  );
};

export default BrandCoursePicker;
