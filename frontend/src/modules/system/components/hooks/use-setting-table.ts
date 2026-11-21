"use client";

import { useState } from "react";
import { useTableState } from "@/shares/hooks/use-table-state";

import { useSettings } from "../../hooks/use-settings";
import type { SystemSetting } from "../../types/setting.types";

/**
 * State và các hành động của bảng cấu hình hệ thống:
 * Tìm kiếm, lọc phân loại, phân trang, mở modal sửa giá trị.
 *
 * @returns State bảng, truy vấn cấu hình và các handler tương tác.
 */
export function useSettingTable() {
  const table = useTableState<"category">({
    ordering: "key",
    filterKeys: ["category"],
  });

  const query = useSettings({
    search: table.filters.search,
    category: table.extraFilters.category,
    ordering: table.filters.ordering,
    page: table.filters.page,
    page_size: table.filters.pageSize,
  });

  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const openEditDialog = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedSetting(null);
  };

  return {
    query,
    table,
    selectedSetting,
    isEditDialogOpen,
    openEditDialog,
    closeEditDialog,
  };
}
