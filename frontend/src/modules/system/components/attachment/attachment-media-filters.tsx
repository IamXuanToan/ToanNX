"use client";

import { useTranslations } from "next-intl";

import { FilterSelect } from "@/shares/components/common/filter-select";

import { mediaFormatsFor } from "../../constants/media-types";

/** @param props - Loại/định dạng được state chủ quản điều khiển. @returns Hai bộ lọc phụ thuộc nhau, dùng chung cho trang và dialog. */
export function AttachmentMediaFilters({
  kinds,
  formats,
  onKindsChange,
  onFormatsChange,
  disabled,
}: {
  kinds: readonly string[];
  formats: readonly string[];
  onKindsChange: (values: string[]) => void;
  onFormatsChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("system.attachment");
  return (
    <>
      <FilterSelect
        label={t("kind")}
        value={kinds}
        onValueChange={onKindsChange}
        disabled={disabled}
        options={[
          { value: "IMAGE", label: t("image") },
          { value: "VIDEO", label: t("video") },
          { value: "DOCUMENT", label: t("document") },
        ]}
      />
      <FilterSelect
        label={t("format")}
        value={formats}
        onValueChange={onFormatsChange}
        disabled={disabled}
        options={mediaFormatsFor(kinds).map(({ value, label }) => ({ value, label }))}
      />
    </>
  );
}
