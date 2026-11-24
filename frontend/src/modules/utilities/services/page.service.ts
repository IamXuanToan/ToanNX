import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  Page,
  PageDetail,
  PageFilters,
  PageInput,
  PageMetadataResult,
  PageStatus,
  PublicPage,
} from "../types/page.types";

/** `content`, `contentConfig` là JSON tùy biến: giữ nguyên khóa của cấu hình. */
const OPAQUE = ["content", "contentConfig", "styleConfig", "responsiveConfig"] as const;

const crud = createCrudService<Page, PageFilters, PageInput, Partial<PageInput>, PageDetail>(
  UTILITIES_API_ENDPOINTS.pages,
  { opaqueKeys: OPAQUE },
);

/** Service trang (BE `utilities/services/page_service.py`). */
export const pageService = {
  ...crud,

  /** @param ids - Id trang. @param status - Trạng thái mới. @returns Số bản ghi đã đổi. */
  bulkSetStatus(ids: string[], status: PageStatus): Promise<number> {
    return crud.bulkUpdate(ids, { status });
  },

  /** @param id - Trang gốc. @returns Bản sao (nháp) của người thực hiện. */
  async duplicate(id: string): Promise<PageDetail> {
    return (
      await apiClient.post<PageDetail>(
        `${UTILITIES_API_ENDPOINTS.pages}/${id}/duplicate`,
        undefined,
        {
          opaqueKeys: OPAQUE,
        },
      )
    ).data;
  },

  /**
   * Lấy thông tin metadata sản phẩm/liên kết từ URL.
   *
   * @param url - Đường dẫn sản phẩm.
   * @returns Thông tin metadata đã trích xuất.
   */
  async fetchMetadata(url: string): Promise<PageMetadataResult> {
    const res = await apiClient.post<PageMetadataResult>(
      UTILITIES_API_ENDPOINTS.pageFetchMetadata,
      { url },
    );
    return res.data;
  },

  /**
   * Lấy dữ liệu công khai của trang qua segment và slug.
   *
   * @param segment - Segment của đường dẫn (ví dụ "p").
   * @param slug - Slug của trang.
   * @param signal - Tín hiệu hủy.
   * @returns Dữ liệu trang công khai.
   */
  async getPublic(segment: string, slug: string, signal?: AbortSignal): Promise<PublicPage> {
    const res = await apiClient.get<PublicPage>(UTILITIES_API_ENDPOINTS.pagePublic(segment, slug), {
      opaqueKeys: OPAQUE,
      signal,
    });
    return res.data;
  },
};
