import { donationKeys, pageKeys, shortLinkKeys } from "@/modules/utilities/constants/query-keys";

/** Query key tổng quan Client Portal (tái dùng key chuẩn của từng tài nguyên để đồng bộ invalidate). */
export const portalKeys = {
  dashboardPages: (userId?: string) =>
    pageKeys.list({ owner: userId ? [userId] : undefined, pageSize: 5 }),
  dashboardLinks: (userId?: string) =>
    shortLinkKeys.list({ owner: userId ? [userId] : undefined, pageSize: 5 }),
  dashboardDonations: (userId?: string) => donationKeys.stats({ owner: userId }),
};
