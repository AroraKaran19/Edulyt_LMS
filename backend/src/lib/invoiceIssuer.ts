import type { Brand } from "../constants/brands";

export interface InvoiceIssuer {
  /** Template file under `public/doc`. */
  template: string;
  gstin: string;
  /** Counter namespace. GST needs one consecutive series per registration. */
  series: string;
  /** Leads the uploaded PDF's filename. */
  filePrefix: string;
}

/**
 * Who issues each brand's tax invoices. Company registration data, so it lives in
 * code: a missing env var would silently ship invoices with a blank GSTIN.
 */
export const INVOICE_ISSUER: Record<Brand, InvoiceIssuer | null> = {
  airkrit: {
    template: "Airkrit - Invoice.docx",
    gstin: "29AAZCA7977J1ZE",
    // The counter key predates brands, so the live sequence continues unbroken.
    series: "invoice",
    filePrefix: "Airkrit_Invoice",
  },
  // Pending: Edulyt's template, GSTIN and number series have not been supplied.
  // Until they are, an Edulyt order's invoice job fails and raises an ops alert
  // rather than going out under Airkrit's registration.
  edulyt: null,
};

export const invoiceIssuerFor = (brand: Brand): InvoiceIssuer => {
  const issuer = INVOICE_ISSUER[brand];
  if (!issuer) {
    throw new Error(`No invoice issuer is configured for ${brand} yet`);
  }
  return issuer;
};
