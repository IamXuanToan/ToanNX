import type { ListParams } from "@/shares/types/api.types";

export const SHORT_LINK_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const SHORT_LINK_FILTER_STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED"] as const;
export const REDIRECT_TYPES = ["302", "301"] as const;

export type ShortLinkStatus = (typeof SHORT_LINK_STATUSES)[number];

/** Owner rút gọn (hiện khi có `manage_all`). */
export type ShortLinkOwner = { id: string; email: string; fullName: string };

/** Một dòng danh sách (BE `ShortLinkListResponseSerializer`). */
export type ShortLink = {
  id: string;
  name: string;
  slug: string;
  shortUrl: string;
  destinationUrl: string;
  redirectType: 301 | 302;
  status: ShortLinkStatus;
  effectiveStatus: ShortLinkStatus | "EXPIRED";
  expiresAt: string | null;
  owner: ShortLinkOwner;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết (BE `ShortLinkDetailResponseSerializer`). */
export type ShortLinkDetail = Omit<ShortLink, "owner"> & {
  ownerId: string;
  description: string;
  redirectWarning: string | null;
};

/** Bộ lọc danh sách (nhiều giá trị). */
export type ShortLinkFilters = ListParams & {
  status?: (typeof SHORT_LINK_FILTER_STATUSES)[number][];
  redirectType?: (typeof REDIRECT_TYPES)[number][];
  owner?: string[];
};

/** Dữ liệu tạo/sửa. */
export type ShortLinkInput = {
  name: string;
  slug?: string;
  destinationUrl: string;
  description?: string;
  redirectType: 301 | 302;
  status: ShortLinkStatus;
  expiresAt: string | null;
};
