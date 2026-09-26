import { NextResponse } from "next/server";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  /** Bare Indian 10-digit, or E.164 for anywhere else. Mirrors the backend. */
  phone: z.string().regex(/^(?:[6-9]\d{9}|\+\d{8,15})$/),
  college: z.string().trim().min(2).max(240),
  /** Shape-checked, never trusted: the backend re-reads the college itself. */
  collegeId: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{24}$/)
    .optional(),
  /** Raw CRM code from `?ref=`. The backend resolves it; this only forwards. */
  ref: z.string().trim().max(32).optional(),
  collegeEmail: z.string().trim().max(160),
  languages: z.array(z.string().trim().max(40)).min(1).max(10),
  degree: z.string().trim().min(1).max(120),
  careerStage: z.string().trim().min(1).max(80),
  /**
   * Answers to the questions the link owner added, if any. Capped at two here
   * as well as server-side, so a crafted request cannot pad the lead's answer
   * list with arbitrary rows.
   */
  extraAnswers: z
    .array(
      z.object({
        key: z.string().trim().max(60),
        label: z.string().trim().max(200),
        value: z.string().trim().max(500),
      }),
    )
    .max(2)
    .optional(),
  /**
   * Either the contact-session token from the anonymous OTP flow, or a
   * signed-in user's access token. The backend decides which it is and reads
   * the proved email and phone from that, so `email` above is only used to
   * spot a payload that never got verified.
   */
  authToken: z.string().trim().min(20).max(4096),
  plan: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  certification: z
    .enum(["Meta", "Microsoft", "Adobe", "Cisco"])
    .nullable()
    .optional(),
  total: z.number().int().min(0).max(1_000_000).optional(),
  source: z.string().max(500).optional(),
});

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

  try {
    const response = await fetch(`${apiBase}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forwarded so the backend can resolve which of the two verification
        // paths this lead came through.
        Authorization: `Bearer ${lead.authToken}`,
      },
      body: JSON.stringify({
        source: "enquiry-form",
        name: lead.name,
        // `phone` is compared against the signed-in profile; the anonymous path
        // ignores it and uses the session. Neither path trusts it as the value.
        phone: lead.phone,
        // Raw fields: the backend words the answers, the same way the Excel import does.
        enquiry: {
          college: lead.college,
          collegeEmail: lead.collegeEmail,
          languages: lead.languages,
          degree: lead.degree,
          careerStage: lead.careerStage,
          plan: lead.plan,
          certification: lead.certification ?? null,
        },
        extraAnswers: lead.extraAnswers,
        total: lead.total,
        collegeId: lead.collegeId,
        ref: lead.ref,
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
