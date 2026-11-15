import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { CUSTOM_PAGES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  Page,
  PageDetail,
  PageFilters,
  PageInput,
  PageStatus,
} from "../types/custom-pages.types";

/** `content` là tài liệu Tiptap: giữ nguyên khóa camelCase của Tiptap (`attachmentId`, `textAlign`). */
const OPAQUE = ["content"] as const;

const crud = createCrudService<Page, PageFilters, PageInput, Partial<PageInput>, PageDetail>(
  CUSTOM_PAGES_API_ENDPOINTS.pages,
  { opaqueKeys: OPAQUE },
);

/** Service trang (BE `custom_pages/services/page_service.py`). */
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
        `${CUSTOM_PAGES_API_ENDPOINTS.pages}/${id}/duplicate`,
        undefined,
        {
          opaqueKeys: OPAQUE,
        },
      )
    ).data;
  },
};
