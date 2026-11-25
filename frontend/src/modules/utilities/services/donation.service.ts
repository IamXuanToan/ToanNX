import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  DonationListParams,
  DonationPublicFeedItem,
  DonationPublicLeaderboardItem,
  DonationStats,
  DonationTransaction,
} from "../types/donation.types";

const crud = createCrudService<DonationTransaction, DonationListParams>(
  UTILITIES_API_ENDPOINTS.donations,
);

/** Service quyên góp (BE `utilities/services/donation_transaction_service.py`). */
export const donationService = {
  ...crud,

  /** Đổi trạng thái ẩn/hiện bình luận. */
  async toggleHidden(
    id: string,
    isHidden: boolean,
    signal?: AbortSignal,
  ): Promise<DonationTransaction> {
    return (
      await apiClient.post<DonationTransaction>(
        UTILITIES_API_ENDPOINTS.donationToggleHidden(id),
        { is_hidden: isHidden },
        { signal },
      )
    ).data;
  },

  /** Lấy số liệu thống kê quyên góp. */
  async stats(
    params?: {
      page_id?: string;
      page?: string;
      date_from?: string;
      date_to?: string;
      owner?: string;
      owner_id?: string;
    },
    signal?: AbortSignal,
  ): Promise<DonationStats> {
    return (
      await apiClient.get<DonationStats>(UTILITIES_API_ENDPOINTS.donationStats, {
        query: params,
        signal,
      })
    ).data;
  },

  /** Lấy danh sách lượt ủng hộ công khai cho trang (hỗ trợ phân trang cuộn). */
  async getPublicFeed(
    pageId: string,
    limit: number = 20,
    page: number = 1,
    signal?: AbortSignal,
  ): Promise<DonationPublicFeedItem[]> {
    return (
      await apiClient.get<DonationPublicFeedItem[]>(
        UTILITIES_API_ENDPOINTS.donationPublicFeed(pageId),
        {
          query: { limit, page },
          signal,
        },
      )
    ).data;
  },

  /** Lấy danh sách Bảng Vinh danh công khai cho trang. */
  async getPublicLeaderboard(
    pageId: string,
    signal?: AbortSignal,
  ): Promise<DonationPublicLeaderboardItem[]> {
    return (
      await apiClient.get<DonationPublicLeaderboardItem[]>(
        UTILITIES_API_ENDPOINTS.donationPublicLeaderboard(pageId),
        { signal },
      )
    ).data;
  },
};
