/**
 * Trang tạo thẻ mới (`/admin/tags/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { TagForm } from "../components/tag-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { TAG_PERMISSIONS } from "../permissions/tag-permission";

/**
 * Giao diện tạo thẻ mới.
 *
 * @returns Khối giao diện form tạo thẻ.
 */
export function TagCreateView() {
  const t = useTranslations("novel.tags");
  const router = useRouter();
  const canCreate = usePermission(TAG_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <TagForm onSaved={() => router.push(NOVEL_ROUTES.adminTags)} />
    </FormPage>
  );
}
