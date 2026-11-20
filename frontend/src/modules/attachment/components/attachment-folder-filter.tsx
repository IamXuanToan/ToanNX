"use client";

import { useTranslations } from "next-intl";

import { FilterSelect } from "@/shares/components/common/filter-select";
import { ErrorState } from "@/shares/components/errors/error-state";

import { UNFILED_FOLDER } from "../constants/media-types";
import { useAttachmentFolders } from "../hooks/use-attachment-folders";
import { folderPath } from "../utils/folder-path";

/** @param props - Phạm vi đọc và các nhóm đang chọn. @returns Bộ lọc nhiều thư mục, luôn có Chưa phân loại. */
export function AttachmentFolderFilter({
  canRead,
  value,
  onChange,
  disabled,
  scope,
}: {
  canRead: boolean;
  value: readonly string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  scope?: readonly string[];
}) {
  const t = useTranslations("attachment");
  const query = useAttachmentFolders(canRead, scope);
  if (canRead && query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  return (
    <FilterSelect
      label={t("folder")}
      value={value}
      onValueChange={onChange}
      disabled={disabled || (canRead && query.isPending)}
      searchable
      options={[
        { value: UNFILED_FOLDER, label: t("unfiled") },
        ...(query.data ?? []).map((folder) => ({
          value: folder.id,
          label: folderPath(folder, query.data ?? []),
          description: t("folderCount", { count: folder.fileCount }),
        })),
      ]}
    />
  );
}
