import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Submit target for the /join campaign form.
 *
 * There is no lead route on the backend yet, so this validates and logs.
 * Point `deliver()` at whichever destination you want: a backend endpoint,
 * a CRM webhook, or a sheet, without touching the form.
 */
const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  plan: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source: z.string().max(500).optional(),
});

type Lead = z.infer<typeof leadSchema>;

async function deliver(lead: Lead) {
  console.log("[join-lead]", lead);
}

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

  await deliver(parsed.data);
  return NextResponse.json({ ok: true });
}
