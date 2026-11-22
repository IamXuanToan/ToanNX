import { z } from "zod";

type Translate = (key: "required" | "positive" | "attachments") => string;

/** Tên trường form hóa đơn có thể nhận lỗi từ BE. */
export const INVOICE_FORM_FIELDS = [
  "docType",
  "number",
  "issuer",
  "issuerTaxCode",
  "issuedOn",
  "periodFrom",
  "periodTo",
  "platformId",
  "currencyId",
  "originalAmount",
  "originalTaxAmount",
  "exchangeRate",
  "attachmentIds",
  "incomeIds",
  "note",
] as const;

const NUMBER = /^\d+(\.\d+)?$/;

/** @param t - Hàm dịch `finance.validation`. @returns Schema form hóa đơn. */
export function invoiceSchema(t: Translate) {
  return z
    .object({
      docType: z.enum(["WITHHOLDING_CERTIFICATE", "INVOICE", "STATEMENT", "CONTRACT", "OTHER"]),
      number: z.string().max(100),
      issuer: z.string().trim().min(1, t("required")).max(255),
      issuerTaxCode: z.string().max(50),
      issuedOn: z.string().min(1, t("required")),
      periodFrom: z.string(),
      periodTo: z.string(),
      platformId: z.string(),
      currencyId: z.string().min(1, t("required")),
      originalAmount: z.string().regex(NUMBER, t("positive")),
      originalTaxAmount: z.string(),
      rateSource: z.enum(["API", "MANUAL"]),
      exchangeRate: z.string(),
      attachmentIds: z.array(z.string()).min(1, t("attachments")),
      incomeIds: z.array(z.string()),
      note: z.string().max(2000),
    })
    .superRefine((value, ctx) => {
      if (value.rateSource === "MANUAL" && !NUMBER.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
      if (value.originalTaxAmount && !NUMBER.test(value.originalTaxAmount)) {
        ctx.addIssue({ code: "custom", path: ["originalTaxAmount"], message: t("positive") });
      }
    });
}

export type InvoiceFormValues = z.infer<ReturnType<typeof invoiceSchema>>;
