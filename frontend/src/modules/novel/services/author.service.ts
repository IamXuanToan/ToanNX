/**
 * Dịch vụ xử lý API liên quan đến Tác giả (Author).
 *
 * Cung cấp các thao tác CRUD quản trị danh sách tác giả.
 */

import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { ListParams } from "@/shares/types/api.types";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Author, AuthorCreateInput, AuthorUpdateInput } from "../types/author.types";

const crud = createCrudService<Author, ListParams, AuthorCreateInput, AuthorUpdateInput, Author>(
  NOVEL_API_ENDPOINTS.authors,
);

/**
 * Service quản lý tài nguyên Tác giả.
 */
export const authorService = {
  ...crud,
};
