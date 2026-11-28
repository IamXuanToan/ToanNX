import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  LanguageCreateInput,
  LanguageFilters,
  LanguageItem,
  LanguageUpdateInput,
} from "../types/language.types";

const crud = createCrudService<
  LanguageItem,
  LanguageFilters,
  LanguageCreateInput,
  LanguageUpdateInput
>(SYSTEM_API_ENDPOINTS.languages);

/** Service quản lý danh mục Ngôn ngữ (`Language`). */
export const languageService = {
  ...crud,

  /**
   * Lấy danh sách ngôn ngữ đang bật (endpoint công khai, cache Redis).
   *
   * @param signal - Tín hiệu hủy.
   * @returns Danh sách ngôn ngữ đang kích hoạt.
   */
  async listActive(signal?: AbortSignal): Promise<LanguageItem[]> {
    const response = await apiClient.get<LanguageItem[]>(SYSTEM_API_ENDPOINTS.languagesActive, {
      signal,
    });
    return response.data;
  },

  /**
   * Bật/tắt hàng loạt ngôn ngữ.
   *
   * @param ids - Danh sách ID ngôn ngữ.
   * @param isActive - Trạng thái bật/tắt mới.
   */
  async bulkSetActive(ids: readonly string[], isActive: boolean): Promise<void> {
    await crud.bulkUpdate([...ids], { isActive });
  },
};
