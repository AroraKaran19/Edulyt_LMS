import { NextResponse } from "next/server";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  userId: z.string().trim().max(64).optional(),
  careerStage: z.enum([
    "Student - 1st Year",
    "Student - 2nd Year",
    "Student - 3rd Year",
    "Student - 4th Year",
    "Passed Out and Unemployed",
    "Working Professional - Non Tech Roles",
    "Working Professional - Tech Roles",
  ]),
  plan: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  certification: z
    .enum(["Meta", "Microsoft", "Adobe", "Cisco"])
    .nullable()
    .optional(),
  total: z.number().int().min(0).max(1_000_000).optional(),
  source: z.string().max(500).optional(),
});

const PLAN_NAMES: Record<number, string> = {
  1: "Blended",
  2: "Mentor-Led",
  3: "Mentor-to-Placement",
};

/**
 * Proxies to the backend rather than letting the browser call it directly.
 * Going through apiClient would put this public page behind its 401
 * interceptor, which redirects to /login and would lose an ad click.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your details" }, { status: 422 });
  }

  const lead = parsed.data;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    console.error("[enquiry-lead] NEXT_PUBLIC_API_BASE_URL is not set");
    return NextResponse.json({ error: "Not available" }, { status: 503 });
  }

  const answers = [
    { key: "careerStage", label: "Career stage", value: lead.careerStage },
    {
      key: "plan",
      label: "Plan you are interested in",
      value: `${PLAN_NAMES[lead.plan]} (Plan 0${lead.plan})`,
    },
    {
      key: "certification",
      label: "MNC certification",
      value: lead.certification
        ? lead.plan === 3
          ? `${lead.certification} (included free)`
          : `${lead.certification} (add-on)`
        : "None selected",
    },
    ...(lead.total !== undefined
      ? [
          {
            key: "total",
            label: "Quoted total",
            value: `₹${lead.total.toLocaleString("en-IN")}`,
          },
        ]
      : []),
  ];

  try {
    const response = await fetch(`${apiBase}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "enquiry-form",
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        answers,
        submittedByUserId: lead.userId,
        pageQuery: lead.source,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        "[enquiry-lead] backend rejected the lead:",
        response.status,
        detail
      );
      return NextResponse.json({ error: "Could not save" }, { status: 502 });
    }
  } catch (error) {
    console.error("[enquiry-lead] backend unreachable:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
