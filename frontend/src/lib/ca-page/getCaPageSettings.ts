import { API_BASE_URL, ENDPOINTS } from "@/constants/endpoints";
import type { CaPageSettings } from "@/types/ca-page-settings";

export const CA_PAGE_SETTINGS_TAG = "ca-page-settings";

const REVALIDATE_SECONDS = 3600;

const FIELD = { enabled: true, required: true, label: "", help: "" };

/** What the page renders when the API is unreachable: closed for applications, default copy. */
export const EMPTY_CA_SETTINGS: CaPageSettings = {
  enrollment: { acceptingApplications: false, durations: [], certificationThresholdPct: 0 },
  form: {
    fields: {
      college: FIELD,
      collegeEmail: FIELD,
      course: FIELD,
      careerStage: FIELD,
      languages: FIELD,
      payout: FIELD,
      address: FIELD,
      whatsapp: FIELD,
    },
    languages: [],
    whatsappLink: "",
  },
  money: {
    stipend: null,
    incentiveCap: null,
    joiningBonus: null,
    kitValue: null,
    lmsValue: null,
    ppoPackageLpa: null,
  },
  statement: { rows: [], footerLabel: "", footerAmount: "" },
  hero: { headline: "", lede: "", jdUrl: "" },
  kit: { photoUrl: "", items: [] },
  videos: { items: [] },
  faqs: { items: [] },
  samples: { offerLetter: "", lor: "", internshipCertificate: "", trainingCertificate: "" },
};

/** Throws on a failed fetch, so a background ISR rebuild keeps the last good page. */
export const fetchCaPageSettings = async (): Promise<CaPageSettings> => {
  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.caPageSettings}`, {
    // Named explicitly rather than relying on the backend's brand default,
    // which this page would silently render closed under if that default
    // ever changed.
    headers: { "X-Brand": "airkrit" },
    next: { tags: [CA_PAGE_SETTINGS_TAG], revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`CA page settings fetch failed: ${res.status}`);
  const body = (await res.json()) as { data?: Partial<CaPageSettings> };
  return { ...EMPTY_CA_SETTINGS, ...(body.data ?? {}) } as CaPageSettings;
};

/** Never throws: a dead API renders with the shipped copy and the form closed. */
export const getCaPageSettings = async (): Promise<CaPageSettings> => {
  try {
    return await fetchCaPageSettings();
  } catch (error) {
    console.error("[ca-page-settings] Falling back to defaults:", error);
    return EMPTY_CA_SETTINGS;
  }
};
