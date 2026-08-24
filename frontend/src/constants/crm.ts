/**
 * Where a shared `?ref=` code lives between the page it arrived on and the
 * submission that spends it.
 *
 * sessionStorage, not localStorage: it is scoped per tab, so two tabs opened
 * from two different people's links each keep their own attribution instead of
 * whichever loaded second overwriting the first.
 *
 * Shared by the enquiry form and the scholarship flow, so a code that arrived
 * on one still attributes a lead captured by the other.
 */
export const REF_STORAGE_KEY = "airkrit.enquiry.ref";
