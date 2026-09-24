import type { CaFaq, CaMoney, CaPageSettings, CaSamples, CaStatementRow } from "@/types/ca-page-settings";

export const DEFAULT_MONEY: Required<{ [K in keyof CaMoney]: number }> = {
  stipend: 5000,
  incentiveCap: 20000,
  joiningBonus: 5000,
  kitValue: 5000,
  lmsValue: 100000,
  ppoPackageLpa: 4.2,
};

export const money = (settings: CaPageSettings) => {
  const m = settings.money;
  return {
    stipend: m.stipend ?? DEFAULT_MONEY.stipend,
    incentiveCap: m.incentiveCap ?? DEFAULT_MONEY.incentiveCap,
    joiningBonus: m.joiningBonus ?? DEFAULT_MONEY.joiningBonus,
    kitValue: m.kitValue ?? DEFAULT_MONEY.kitValue,
    lmsValue: m.lmsValue ?? DEFAULT_MONEY.lmsValue,
    ppoPackageLpa: m.ppoPackageLpa ?? DEFAULT_MONEY.ppoPackageLpa,
  };
};

export const inr = (n: number): string => `₹${n.toLocaleString("en-IN")}`;

/** "₹1 lakh" for round lakhs, otherwise the plain amount. */
export const inrShort = (n: number): string =>
  n >= 100000 && n % 100000 === 0 ? `₹${n / 100000} lakh` : inr(n);

export const DEFAULT_HEADLINE = "Your first salary starts on campus.";

export const defaultLede = (m: ReturnType<typeof money>) =>
  `Become an Airkrit Campus Ambassador. Promote Airkrit at your college, in hours that fit around your classes, and get paid a fixed ${inr(m.stipend)} every month plus up to ${inr(m.incentiveCap)} in incentives.`;

export const DEFAULT_KIT_ITEMS = ["Bag", "Diary", "Pen", "T-shirt", "Cap"];

// Keeps "T-shirt" and acronyms as written.
const lowerFirst = (s: string) => (/^[A-Z][A-Z-]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

// en-GB: the copy has no serial comma ("a T-shirt and a cap").
const listFormat = new Intl.ListFormat("en-GB", { type: "conjunction" });

/** "bag, diary, pen, T-shirt and cap", or with articles for the shipped item names. */
export const kitList = (items: string[], withArticles = false): string =>
  listFormat.format(
    items.map((item) => {
      const word = lowerFirst(item.trim());
      return withArticles ? `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}` : word;
    }),
  );

export const DEFAULT_SAMPLES: CaSamples = {
  offerLetter: "/course-certificates/certificate-4.svg",
  lor: "/course-certificates/certificate-3.svg",
  internshipCertificate: "/course-certificates/certificate-1.svg",
  trainingCertificate: "/course-certificates/certificate-2.svg",
};

export const defaultFaqs = (m: ReturnType<typeof money>): CaFaq[] => [
  {
    question: "Is this a paid role?",
    answer: `Yes. Once you meet the month 1 target you get a fixed ${inr(m.stipend)} every month, with no deductions, plus incentives of up to ${inr(m.incentiveCap)} a month based on your performance. Everything is paid to the UPI ID you give us.`,
  },
  {
    question: "Will it clash with my classes?",
    answer: "No. The timings are flexible and most of the work happens on your own campus, so it fits around your college schedule.",
  },
  {
    question: "What is the month 1 target?",
    answer: "Stay active, promote Airkrit on campus, and convert 2 sales or 4 leads that turn into sales. Hit it and your fixed stipend starts.",
  },
  {
    question: "When do I get my offer letter?",
    answer: "As soon as your counsellor approves you after the onboarding call, usually within 24 hours of applying. It comes to your email.",
  },
  {
    question: "What do I get at the end?",
    answer: `A letter of recommendation, an internship certificate and a training certificate. Top performers also get a year of LMS access worth ${inrShort(m.lmsValue)} and a shot at a full-time offer of ${m.ppoPackageLpa} LPA.`,
  },
  {
    question: "Can I apply from outside India?",
    answer: "Yes. Choose your country code when you enter your mobile number, and give us your payout details instead of a UPI ID.",
  },
];

export const DEFAULT_STATEMENT_FOOTER_LABEL = "A top month";
export const DEFAULT_STATEMENT_FOOTER_AMOUNT = "{topMonth}";

/** Shipped statement rows; text holds placeholders resolved at render time. */
export const DEFAULT_STATEMENT_ROWS: CaStatementRow[] = [
  {
    when: "Today",
    what: "Fill in your details and verify your mobile number.",
    gets: [{ icon: "none", title: "Your application goes to a counsellor", note: "" }],
    credit: null,
  },
  {
    when: "Within 24 hours",
    what: "Your counsellor calls you for onboarding and a formal discussion about the role.",
    gets: [{ icon: "doc", title: "Offer letter", note: "emailed the moment you're approved" }],
    credit: null,
  },
  {
    when: "After you accept",
    what: "Attend leadership calls to learn how the work is done. Your tasks start showing up in your dashboard.",
    gets: [
      { icon: "gift", title: "Joining bonus", note: "worth {joiningBonus}" },
      { icon: "key", title: "Access to the Airkrit work portal", note: "" },
    ],
    credit: null,
  },
  {
    when: "Month 1",
    what: "Promote Airkrit on campus and convert 2 sales, or 4 leads that turn into sales.",
    gets: [
      { icon: "rupee", title: "Fixed stipend", note: "paid monthly, no deductions" },
      { icon: "box", title: "Joining kit worth {kitValue}", note: "{kitItems}" },
    ],
    credit: { amount: "+ {stipend}", prefix: "" },
  },
  {
    when: "Every month",
    what: "Keep bringing in sales. Your incentive grows with your performance.",
    gets: [{ icon: "trend", title: "Performance incentive", note: "" }],
    credit: { amount: "+ {incentiveCap}", prefix: "up to" },
  },
  {
    when: "When you finish",
    what: "Complete your tenure as a Campus Ambassador.",
    gets: [
      { icon: "doc", title: "Letter of recommendation", note: "" },
      { icon: "award", title: "Internship certificate", note: "" },
      { icon: "award", title: "Training certificate", note: "" },
    ],
    credit: null,
  },
  {
    when: "Top performers",
    what: "Stand out across your tenure.",
    gets: [
      { icon: "book", title: "1 year of LMS access", note: "worth {lmsValue}" },
      { icon: "case", title: "A shot at a full-time offer", note: "{ppoPackageLpa} LPA placement" },
    ],
    credit: null,
  },
];

const STATEMENT_PLACEHOLDERS = new Set([
  "stipend",
  "incentiveCap",
  "joiningBonus",
  "kitValue",
  "lmsValue",
  "ppoPackageLpa",
  "topMonth",
  "kitItems",
]);

/** Fills `{stipend}`, `{kitItems}` and friends; an unknown `{token}` renders as-is. */
export const resolveStatementText = (
  text: string,
  m: ReturnType<typeof money>,
  kitItems: string[],
): string =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!STATEMENT_PLACEHOLDERS.has(key)) return match;
    switch (key) {
      case "stipend":
        return inr(m.stipend);
      case "incentiveCap":
        return inr(m.incentiveCap);
      case "joiningBonus":
        return inr(m.joiningBonus);
      case "kitValue":
        return inr(m.kitValue);
      case "lmsValue":
        return inrShort(m.lmsValue);
      case "ppoPackageLpa":
        return String(m.ppoPackageLpa);
      case "topMonth":
        return inr(m.stipend + m.incentiveCap);
      case "kitItems":
        return kitList(kitItems);
      default:
        return match;
    }
  });

export const SUPPORT_PHONE = {
  display: "+91-8929252575",
  tel: "tel:+918929252575",
  whatsapp: "https://wa.me/918929252575",
};
