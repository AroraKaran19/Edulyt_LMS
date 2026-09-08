/**
 * Every mail template the platform sends, one module per template, named after
 * the HTML in `src/templates/emails/`.
 *
 * Callers import from here rather than from a module directly, so a template
 * can be split into variants or moved without touching the send sites. The
 * machinery behind `defineMailTemplate` lives in `utils/mailTemplates.ts`.
 */

export * from "./courseCertificate.mail";
export * from "./emailChangeVerification.mail";
export * from "./entranceExam.mail";
export * from "./emailChanged.mail";
export * from "./edulytEnquiryReceived.mail";
export * from "./internalAlert.mail";
export * from "./internshipApplicationReceived.mail";
export * from "./internshipBatchChanged.mail";
export * from "./internshipClosure.mail";
export * from "./internshipVoucher.mail";
export * from "./passwordReset.mail";
export * from "./purchaseConfirmation.mail";
export * from "./referralUsed.mail";
export * from "./reviewPosted.mail";
export * from "./scholarshipCoupon.mail";
export * from "./verificationCode.mail";
export * from "./signupVerification.mail";
