/** Kiểu dữ liệu cho nghiệp vụ quyên góp / ủng hộ (Donation). */

export type DonationTier = "NORMAL" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export type DonationGiftType =
  "NOODLE" | "COFFEE" | "BREAKFAST" | "BOOK" | "HOTPOT" | "SPECIAL" | "CUSTOM";

export type DonationTransaction = {
  id: string;
  pageId: string;
  pageTitle: string;
  qrItemId: string;
  sepayId: string;
  amount: number;
  donorTitle: string;
  message: string;
  originalContent: string;
  giftType: DonationGiftType;
  giftLabel: string;
  tier: DonationTier;
  tierExpiresAt: string | null;
  isHidden: boolean;
  isCensored: boolean;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DonationPublicFeedItem = {
  id: string;
  donorTitle: string;
  amount: number | null;
  hideAmount: boolean;
  giftType: DonationGiftType;
  giftLabel: string;
  tier: DonationTier;
  tierExpiresAt: string | null;
  message: string;
  receivedAt: string;
};

export type DonationPublicLeaderboardItem = {
  id: string;
  donorTitle: string;
  amount: number | null;
  hideAmount?: boolean;
  giftLabel: string;
  tier: DonationTier;
  tierExpiresAt: string | null;
  message: string;
  receivedAt: string;
};

export type DonationDailyTrend = {
  date: string;
  amount: number;
  count: number;
};

export type DonationStats = {
  totalAmount: number;
  totalCount: number;
  censoredCount: number;
  hiddenCount: number;
  byGift: Array<{
    gift_type: string;
    gift_label: string;
    count: number;
    total: number;
  }>;
  activeTierCounts: Record<string, number>;
  dailyTrend?: DonationDailyTrend[];
};

export type DonationListParams = {
  page?: number;
  pageSize?: number;
  page_id?: string;
  search?: string;
  ordering?: string;
  tier?: DonationTier | readonly string[];
  isHidden?: boolean;
  isCensored?: boolean;
  dateFrom?: string;
  dateTo?: string;
  owner?: string;
};
