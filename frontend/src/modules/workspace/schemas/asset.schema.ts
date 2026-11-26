import { z } from "zod";

import {
  ASSET_CATEGORIES,
  ASSET_PURCHASE_CHANNELS,
  ASSET_STATUSES,
  ASSET_WARRANTY_TYPES,
  WORKSPACE_NOTIFICATION_CHANNELS,
} from "../constants/defaults";

type Translate = (
  key: "required" | "nonNegative" | "positive" | "url" | "months" | "atLeastOneChannel",
) => string;

const NON_NEGATIVE = /^\d+(\.\d+)?$/;
const POSITIVE_RATE = /^(?!0+(\.0+)?$)\d+(\.\d+)?$/;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Tên trường form Thiết bị có thể nhận lỗi từ BE. */
export const ASSET_FORM_FIELDS = [
  "name",
  "brand",
  "modelCode",
  "category",
  "serialNumber",
  "imei",
  "status",
  "purchaseDate",
  "purchasePrice",
  "currencyId",
  "exchangeRate",
  "purchaseStore",
  "purchaseChannel",
  "purchaseBranchAddress",
  "purchaseOrderCode",
  "purchaseOrderUrl",
  "storeWarrantyContact",
  "warrantyType",
  "warrantyMonths",
  "warrantyStartDate",
  "warrantyEndDate",
  "warrantyProvider",
  "warrantyNote",
  "invoiceAttachmentIds",
  "notes",
  "notificationChannels",
] as const;

/**
 * Schema form Thiết bị cá nhân (tạo = sửa).
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function assetSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t("required")).max(200),
      brand: z.string().trim().max(120),
      modelCode: z.string().trim().max(120),
      category: z.enum(ASSET_CATEGORIES),
      serialNumber: z.string().trim().max(120),
      imei: z.string().trim().max(64),
      status: z.enum(ASSET_STATUSES),
      purchaseDate: z.string().min(1, t("required")),
      purchasePrice: z.string().trim(),
      currencyId: z.string().min(1, t("required")),
      exchangeRate: z.string().trim(),
      purchaseStore: z.string().trim().max(200),
      purchaseChannel: z.enum(ASSET_PURCHASE_CHANNELS),
      purchaseBranchAddress: z.string().trim().max(300),
      purchaseOrderCode: z.string().trim().max(120),
      purchaseOrderUrl: z.string().trim().max(500),
      storeWarrantyContact: z.string().trim().max(200),
      warrantyType: z.enum(ASSET_WARRANTY_TYPES),
      warrantyMonths: z.string().trim(),
      warrantyStartDate: z.string(),
      warrantyEndDate: z.string(),
      warrantyProvider: z.string().trim().max(200),
      warrantyNote: z.string().max(1000),
      invoiceAttachmentIds: z.array(z.string()),
      notes: z.string().max(2000),
      notificationChannels: z
        .array(z.enum(WORKSPACE_NOTIFICATION_CHANNELS))
        .min(1, t("atLeastOneChannel")),
    })
    .superRefine((value, ctx) => {
      if (value.purchasePrice && !NON_NEGATIVE.test(value.purchasePrice)) {
        ctx.addIssue({ code: "custom", path: ["purchasePrice"], message: t("nonNegative") });
      }
      if (value.exchangeRate && !POSITIVE_RATE.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
      if (value.purchaseOrderUrl && !HTTP_URL.test(value.purchaseOrderUrl)) {
        ctx.addIssue({ code: "custom", path: ["purchaseOrderUrl"], message: t("url") });
      }
      if (
        value.warrantyMonths &&
        (!/^\d+$/.test(value.warrantyMonths) ||
          Number(value.warrantyMonths) < 0 ||
          Number(value.warrantyMonths) > 240)
      ) {
        ctx.addIssue({ code: "custom", path: ["warrantyMonths"], message: t("months") });
      }
    });
}

export type AssetFormValues = z.infer<ReturnType<typeof assetSchema>>;
