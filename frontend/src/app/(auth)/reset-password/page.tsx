import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

/** The emailed link from `POST /auth/generate-reset-password-token` lands here. */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
