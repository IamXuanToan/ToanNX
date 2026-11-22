"use client";

import { useState } from "react";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";

import { settingKeys } from "../../../constants/query-keys";
import { useDeleteSetting } from "../../../hooks/use-delete-setting";
import { useSettings } from "../../../hooks/use-settings";
import { settingService } from "../../../services/setting.service";
import type { SystemSetting } from "../../../types/setting.types";

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
  const [isReadOnly, setIsReadOnly] = useState(true);
  const remove = useDeleteSetting();
  const bulk = useBulkActions<SystemSetting>({
    service: settingService,
    invalidate: [settingKeys.all, settingKeys.public()],
  });

  /** Mở dialog giá trị: `readOnly` = Xem (không lưu được), ngược lại = Sửa. */
  const openDialog = (setting: SystemSetting, readOnly: boolean) => {
    setSelectedSetting(setting);
    setIsReadOnly(readOnly);
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
    isReadOnly,
    view: (setting: SystemSetting) => openDialog(setting, true),
    edit: (setting: SystemSetting) => openDialog(setting, false),
    remove: (setting: SystemSetting) => remove.mutateAsync(setting.id),
    bulkDelete: bulk.bulkDelete,
    closeEditDialog,
  };
}
