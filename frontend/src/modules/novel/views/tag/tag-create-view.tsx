/**
 * Trang tạo thẻ mới (`/admin/tags/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { TagForm } from "../../components/tag/tag-form";
import { TAG_PERMISSIONS } from "../../permissions/tag-permission";

/**
 * Giao diện tạo thẻ mới.
 *
 * @returns Khối giao diện form tạo thẻ.
 */
export function TagCreateView() {
  const t = useTranslations("novel.tags");
  const canCreate = usePermission(TAG_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <TagForm />
    </FormPage>
  );
}
