import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type { PagePath, PagePathFilters, PagePathInput } from "../types/page-path.types";

/** Service đường dẫn giữa (BE `utilities/services/page_path_service.py`): CRUD chuẩn. */
export const pagePathService = createCrudService<PagePath, PagePathFilters, PagePathInput>(
  UTILITIES_API_ENDPOINTS.pagePaths,
);
