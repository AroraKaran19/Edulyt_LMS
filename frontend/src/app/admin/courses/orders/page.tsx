import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ search?: string | string[] }>;
};

/** @deprecated Use `/admin/orders` */
export default async function LegacyCoursesOrdersRedirect({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const raw = sp.search;
  const q = Array.isArray(raw) ? raw[0] : raw;
  if (typeof q === "string" && q.length > 0) {
    redirect(`/admin/orders?search=${encodeURIComponent(q)}`);
  }
  redirect("/admin/orders");
}
