"use client";

import { BookOpen } from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import { cn } from "@/lib/utils";
import type { CaVoucherCourse, CaVoucherPlan } from "@/types/ca-voucher";
import s from "../desk.module.css";

export const PLAN_LABEL: Record<CaVoucherPlan, string> = { elite: "Elite", essential: "Essential" };

export function PlanPill({ plan }: { plan: CaVoucherPlan }) {
  return <span className={cn(s.planPill, plan === "elite" ? s.planElite : s.planEssential)}>{PLAN_LABEL[plan]}</span>;
}

export function CourseThumb({ course, sizes }: { course: CaVoucherCourse; sizes: string }) {
  return course.thumbnail ? (
    <ImageComponent src={course.thumbnail} alt="" fill sizes={sizes} className={s.thumbImg} />
  ) : (
    <span className={s.thumbFallback} aria-hidden="true">
      <BookOpen />
    </span>
  );
}
