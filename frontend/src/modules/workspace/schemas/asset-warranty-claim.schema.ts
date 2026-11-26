import { z } from "zod";

import { CLAIM_STATUSES, CLAIM_TYPES } from "../constants/defaults";

type Translate = (key: "required" | "nonNegative" | "positive" | "months") => string;

const NON_NEGATIVE = /^\d+(\.\d+)?$/;
const POSITIVE_RATE = /^(?!0+(\.0+)?$)\d+(\.\d+)?$/;

/** Tên trường form Phiếu bảo hành / sửa chữa. */
export const ASSET_WARRANTY_CLAIM_FORM_FIELDS = [
  "assetId",
  "claimCode",
  "claimType",
  "status",
  "submittedDate",
  "estimatedReturnDate",
  "returnedDate",
  "serviceCenter",
  "serviceCenterAddress",
  "serviceCenterContact",
  "externalTicketCode",
  "issueDescription",
  "resolutionNotes",
  "isCoveredByWarranty",
  "cost",
  "currencyId",
  "exchangeRate",
  "partWarrantyMonths",
  "partWarrantyEndDate",
  "attachmentIds",
] as const;

/**
 * Schema form Phiếu bảo hành / sửa chữa thiết bị.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function assetWarrantyClaimSchema(t: Translate) {
  return z
    .object({
      assetId: z.string().min(1, t("required")),
      claimCode: z.string().trim().max(100),
      claimType: z.enum(CLAIM_TYPES),
      status: z.enum(CLAIM_STATUSES),
      submittedDate: z.string().min(1, t("required")),
      estimatedReturnDate: z.string(),
      returnedDate: z.string(),
      serviceCenter: z.string().trim().min(1, t("required")).max(200),
      serviceCenterAddress: z.string().trim().max(300),
      serviceCenterContact: z.string().trim().max(200),
      externalTicketCode: z.string().trim().max(120),
      issueDescription: z.string().trim().min(1, t("required")).max(2000),
      resolutionNotes: z.string().max(2000),
      isCoveredByWarranty: z.boolean(),
      cost: z.string().trim(),
      currencyId: z.string().min(1, t("required")),
      exchangeRate: z.string().trim(),
      partWarrantyMonths: z.string().trim(),
      partWarrantyEndDate: z.string(),
      attachmentIds: z.array(z.string()),
    })
    .superRefine((value, ctx) => {
      if (value.cost && !NON_NEGATIVE.test(value.cost)) {
        ctx.addIssue({ code: "custom", path: ["cost"], message: t("nonNegative") });
      }
      if (value.exchangeRate && !POSITIVE_RATE.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
      if (
        value.partWarrantyMonths &&
        (!/^\d+$/.test(value.partWarrantyMonths) ||
          Number(value.partWarrantyMonths) < 0 ||
          Number(value.partWarrantyMonths) > 240)
      ) {
        ctx.addIssue({ code: "custom", path: ["partWarrantyMonths"], message: t("months") });
      }
    });
}

export type AssetWarrantyClaimFormValues = z.infer<ReturnType<typeof assetWarrantyClaimSchema>>;
