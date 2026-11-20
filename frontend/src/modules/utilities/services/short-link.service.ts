import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  ShortLink,
  ShortLinkDetail,
  ShortLinkFilters,
  ShortLinkInput,
  ShortLinkStatus,
} from "../types/short-link.types";

const crud = createCrudService<
  ShortLink,
  ShortLinkFilters,
  ShortLinkInput,
  Partial<ShortLinkInput>,
  ShortLinkDetail
>(UTILITIES_API_ENDPOINTS.shortLinks);

/** Service link rút gọn (BE `utilities/services/short_link_service.py`). */
export const shortLinkService = {
  ...crud,

  /** @param input - Dữ liệu form; slug trống thì BE tự sinh. @returns Link mới. */
  create(input: ShortLinkInput): Promise<ShortLinkDetail> {
    const { slug, ...rest } = input;
    return crud.create(slug ? input : rest);
  },

  /** @param slug - Slug công khai. @param password - Mật khẩu người xem nhập. @returns URL đích. */
  async unlock(slug: string, password: string): Promise<string> {
    const response = await apiClient.post<{ destinationUrl: string }>(
      UTILITIES_API_ENDPOINTS.shortLinkResolve(slug),
      { password },
    );
    return response.data.destinationUrl;
  },

  /** @param ids - Id link. @param status - Bật/tắt. @returns Số bản ghi đã đổi. */
  bulkSetStatus(ids: string[], status: ShortLinkStatus): Promise<number> {
    return crud.bulkUpdate(ids, { status });
  },
};
