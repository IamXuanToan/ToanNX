import type { Attachment } from "@/modules/system/types/attachment.types";
import type { ListParams } from "@/shares/types/api.types";

/** Lịch sử thanh toán gia hạn dịch vụ định kỳ (khớp `SubscriptionPaymentResponse`). */
export type SubscriptionPayment = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  subscriptionId: string;
  subscriptionName: string;
  paidOn: string;
  periodFrom: string;
  periodTo: string;
  amount: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  exchangeRate: string;
  amountVnd: string;
  paymentMethod: string;
  receiptAttachmentId: string | null;
  receiptAttachment: Attachment | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

/** Bộ lọc lịch sử gia hạn dịch vụ. */
export type SubscriptionPaymentFilters = ListParams & {
  subscription?: string;
  currency?: string;
  owner?: string;
};
