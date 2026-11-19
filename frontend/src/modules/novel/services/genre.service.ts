/**
 * Dịch vụ xử lý API liên quan đến Thể loại tiểu thuyết (Genre).
 *
 * Cung cấp các thao tác CRUD quản trị danh mục thể loại.
 */

import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { ListParams } from "@/shares/types/api.types";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Genre, GenreCreateInput, GenreUpdateInput } from "../types/genre.types";

const crud = createCrudService<Genre, ListParams, GenreCreateInput, GenreUpdateInput, Genre>(
  NOVEL_API_ENDPOINTS.genres,
);

/**
 * Service quản lý tài nguyên Thể loại.
 */
export const genreService = {
  ...crud,
};
