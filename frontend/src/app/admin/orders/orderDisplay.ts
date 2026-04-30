export type AdminOrderKind =
  | "course"
  | "internship_seat"
  | "internship_success_points";

export function getAdminOrderProductLabel(item: {
  orderKind?: AdminOrderKind | string;
  courseId?: { title?: string } | null;
  courseName?: string;
  internshipTitle?: string;
  internshipSuccessPointsQuantity?: number;
}): string {
  const kind = (item.orderKind as AdminOrderKind) ?? "course";

  if (kind === "internship_success_points") {
    const q = item.internshipSuccessPointsQuantity;
    const title = item.internshipTitle?.trim();
    if (title && q) return `${title} · Success points × ${q}`;
    if (title) return `${title} · Success points`;
    if (q) return `Internship success points × ${q}`;
    return "Internship success points";
  }

  if (kind === "internship_seat") {
    return (
      item.internshipTitle?.trim() ||
      item.courseName?.trim() ||
      "Internship seat"
    );
  }

  return item.courseId?.title || item.courseName?.trim() || "—";
}

export function getAdminOrderTypeLabel(kind?: AdminOrderKind | string): string {
  switch (kind) {
    case "internship_seat":
      return "Internship seat";
    case "internship_success_points":
      return "Success points";
    default:
      return "Course";
  }
}
