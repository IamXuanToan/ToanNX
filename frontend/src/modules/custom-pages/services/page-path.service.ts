import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { CUSTOM_PAGES_API_ENDPOINTS } from "../constants/api-endpoints";
import type { PagePath, PagePathFilters, PagePathInput } from "../types/custom-pages.types";

/** Service đường dẫn giữa (BE `custom_pages/services/page_path_service.py`): CRUD chuẩn. */
export const pagePathService = createCrudService<PagePath, PagePathFilters, PagePathInput>(
  CUSTOM_PAGES_API_ENDPOINTS.paths,
);
