/**
 * Dịch vụ xử lý API liên quan đến Thẻ phân loại (Tag).
 *
 * Cung cấp các thao tác CRUD quản trị danh mục thẻ truyện.
 */

import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { ListParams } from "@/shares/types/api.types";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Tag, TagCreateInput, TagUpdateInput } from "../types/tag.types";

const crud = createCrudService<Tag, ListParams, TagCreateInput, TagUpdateInput, Tag>(
  NOVEL_API_ENDPOINTS.tags,
);

/**
 * Service quản lý tài nguyên Thẻ phân loại.
 */
export const tagService = {
  ...crud,
};
