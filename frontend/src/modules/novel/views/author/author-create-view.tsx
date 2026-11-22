/**
 * Trang tạo tác giả mới (`/admin/authors/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AuthorForm } from "../../components/author/author-form";
import { AUTHOR_PERMISSIONS } from "../../permissions/author-permission";

/**
 * Giao diện tạo tác giả mới.
 *
 * @returns Khối giao diện form tạo tác giả.
 */
export function AuthorCreateView() {
  const t = useTranslations("novel.authors");
  const canCreate = usePermission(AUTHOR_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <AuthorForm />
    </FormPage>
  );
}
