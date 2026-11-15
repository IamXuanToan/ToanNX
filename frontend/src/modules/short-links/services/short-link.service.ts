import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SHORT_LINKS_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  ShortLink,
  ShortLinkDetail,
  ShortLinkFilters,
  ShortLinkInput,
  ShortLinkStatus,
} from "../types/short-links.types";

const crud = createCrudService<
  ShortLink,
  ShortLinkFilters,
  ShortLinkInput,
  Partial<ShortLinkInput>,
  ShortLinkDetail
>(SHORT_LINKS_API_ENDPOINTS.links);

/** Service link rút gọn (BE `short_links/services/short_link_service.py`). */
export const shortLinkService = {
  ...crud,

  /** @param input - Dữ liệu form; slug trống thì BE tự sinh. @returns Link mới. */
  create(input: ShortLinkInput): Promise<ShortLinkDetail> {
    const { slug, ...rest } = input;
    return crud.create(slug ? input : rest);
  },

  /** @param ids - Id link. @param status - Bật/tắt. @returns Số bản ghi đã đổi. */
  bulkSetStatus(ids: string[], status: ShortLinkStatus): Promise<number> {
    return crud.bulkUpdate(ids, { status });
  },
};
