import type { ListParams } from "@/shares/types/api.types";

export const SHORT_LINK_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const SHORT_LINK_FILTER_STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED"] as const;

export type ShortLinkStatus = (typeof SHORT_LINK_STATUSES)[number];

/** Owner rút gọn (hiện khi có `manage_all`). */
export type ShortLinkOwner = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
};

/** Một dòng danh sách (BE `ShortLinkListResponseSerializer`). */
export type ShortLink = {
  id: string;
  name: string;
  slug: string;
  shortUrl: string;
  destinationUrl: string;
  autoRedirectSeconds: number | null;
  hasPassword: boolean;
  status: ShortLinkStatus;
  effectiveStatus: ShortLinkStatus | "EXPIRED";
  expiresAt: string | null;
  clicksCount: number;
  visitorsCount: number;
  lastAccessedAt: string | null;
  owner: ShortLinkOwner;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết (BE `ShortLinkDetailResponseSerializer`). */
export type ShortLinkDetail = Omit<ShortLink, "owner"> & {
  ownerId: string;
  description: string;
};

/** Bộ lọc danh sách (nhiều giá trị). */
export type ShortLinkFilters = ListParams & {
  status?: (typeof SHORT_LINK_FILTER_STATUSES)[number][];
  owner?: string[];
};

/** Dữ liệu tạo/sửa. */
export type ShortLinkInput = {
  name: string;
  slug?: string;
  destinationUrl: string;
  description?: string;
  autoRedirectSeconds: number | null;
  password?: string;
  status: ShortLinkStatus;
  expiresAt?: string | null;
};

/** Thông tin trang trung gian công khai; link khóa không lộ URL đích. */
export type PublicShortLink = {
  name: string;
  description: string;
  destinationUrl: string | null;
  hasPassword: boolean;
  autoRedirectSeconds: number | null;
};
