/**
 * Trang tạo chương mới (`/admin/chapters/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ChapterForm } from "../../components/chapter/chapter-form";
import { CHAPTER_PERMISSIONS } from "../../permissions/chapter-permission";

/**
 * Giao diện tạo chương mới.
 *
 * @param props - novelId (tùy chọn) nếu tạo cho một bộ truyện cụ thể.
 * @returns Khối giao diện form tạo chương.
 */
export function ChapterCreateView({ novelId }: { novelId?: string } = {}) {
  const t = useTranslations("novel.chapters");
  const canCreate = usePermission(CHAPTER_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <ChapterForm novelId={novelId} />
    </FormPage>
  );
}
