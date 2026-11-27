import type { ListParams } from "@/shares/types/api.types";

import type { BILLING_CYCLES, SUBSCRIPTION_CATEGORIES } from "../constants/defaults";

export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type AdvanceFrom = "cycle" | "today";

/** Dịch vụ định kỳ (khớp `SubscriptionResponse`). */
export type Subscription = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string | null;
  name: string;
  provider: string;
  category: SubscriptionCategory;
  billingCycle: BillingCycle;
  customCycleDays: number | null;
  anchorDay: number;
  amount: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  exchangeRate: string;
  amountVnd: string;
  renewDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  manageUrl: string;
  reminderDaysBefore: number[];
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào tạo/cập nhật Dịch vụ định kỳ. */
export type SubscriptionInput = {
  name: string;
  provider?: string;
  category?: SubscriptionCategory;
  billingCycle?: BillingCycle;
  customCycleDays?: number | null;
  anchorDay?: number | null;
  amount: string;
  currencyId: string;
  exchangeRate?: string | null;
  renewDate: string;
  autoRenew?: boolean;
  paymentMethod?: string;
  manageUrl?: string;
  reminderDaysBefore?: number[];
  isActive?: boolean;
  notes?: string;
};

/** Đầu vào gia hạn dịch vụ định kỳ. */
export type SubscriptionRenewInput = {
  paidOn?: string | null;
  amount?: string | null;
  exchangeRate?: string | null;
  paymentMethod?: string;
  receiptAttachmentId?: string | null;
  note?: string;
  advanceFrom?: AdvanceFrom;
};

/** Bộ lọc danh sách Dịch vụ định kỳ. */
export type SubscriptionFilters = ListParams & {
  category?: readonly string[];
  billingCycle?: readonly string[];
  isActive?: boolean;
  autoRenew?: boolean;
  owner?: string;
};
