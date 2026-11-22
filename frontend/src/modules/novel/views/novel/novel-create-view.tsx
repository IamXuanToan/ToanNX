/**
 * Trang quản trị: Tạo mới tiểu thuyết (`/admin/novels/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { NovelForm } from "../../components/novel/novel-form";
import { NOVEL_PERMISSIONS } from "../../permissions/novel-permission";

/**
 * Giao diện tạo tiểu thuyết mới.
 *
 * @returns FormPage tạo tiểu thuyết.
 */
export function NovelCreateView() {
  const t = useTranslations("novel.admin");
  const canCreate = usePermission(NOVEL_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <NovelForm />
    </FormPage>
  );
}
