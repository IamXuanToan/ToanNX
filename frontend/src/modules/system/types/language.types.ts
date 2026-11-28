/** Bản ghi ngôn ngữ trong danh mục hệ thống (`Language`). */
export type LanguageItem = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Dữ liệu tạo mới ngôn ngữ. */
export type LanguageCreateInput = {
  code: string;
  name: string;
  nativeName?: string;
  flagEmoji?: string;
  isActive?: boolean;
  sortOrder?: number;
};

/** Dữ liệu cập nhật ngôn ngữ. */
export type LanguageUpdateInput = Partial<LanguageCreateInput>;

/** Tham số lọc danh sách ngôn ngữ. */
export type LanguageFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  isActive?: boolean;
  isDefault?: boolean;
};
