import { toast } from "react-toastify";
import { ACCOUNT_DISABLED_MESSAGE } from "@/constants/authMessages";

/**
 * NextAuth forwards the thrown Error message from `authorize` as `result.error`.
 * Decode it and show the right toast.
 */
export function showLoginErrorToast(error: string | undefined): void {
  if (!error) {
    toast.error("Something went wrong. Please try again.");
    return;
  }

  let message = error;
  try {
    message = decodeURIComponent(error);
  } catch {
    /* keep raw */
  }

  // Exact match from backend constant (both credentials and OAuth)
  if (
    message === ACCOUNT_DISABLED_MESSAGE ||
    message.includes("disabled by our system")
  ) {
    toast.error(ACCOUNT_DISABLED_MESSAGE, { position: "top-center" });
    return;
  }

  // NextAuth default when authorize() returns null (shouldn't happen now we throw)
  if (message === "CredentialsSignin") {
    toast.error("Invalid email or password.");
    return;
  }

  toast.error(message);
}
