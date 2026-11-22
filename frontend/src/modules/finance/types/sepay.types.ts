import type { PREVIEW_STATUSES } from "../constants/finance-enums";

/** Trạng thái kết nối SePay của chính mình (không bao giờ có token). */
export type SepayStatus = {
  connected: boolean;
  environment: string;
  isActive: boolean;
  tokenLast4: string;
  webhookUrl: string;
  webhookSecret: string;
  lastWebhookAt: string | null;
  lastSyncAt: string | null;
  lastError: string;
};

export type SepayPreviewStatus = (typeof PREVIEW_STATUSES)[number];

/** Một dòng xem trước lấy thủ công. */
export type SepayPreviewRow = {
  sepayId: string;
  status: SepayPreviewStatus;
  receivedAt: string;
  amount: string | null;
  content: string;
  referenceCode: string;
  platformId: string | null;
  platformName: string;
  taxRate: string | null;
  taxAmount: string | null;
  incomeId: string | null;
  existingAmount: string | null;
  existingReceivedAt: string | null;
  existingContent: string;
};

export type SepayImportResult = { created: number; updated: number; skipped: number };
