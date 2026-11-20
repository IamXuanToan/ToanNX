/**
 * Trang quản trị: Tạo mới tiểu thuyết (`/admin/novels/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { NovelForm } from "../components/novel-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { NOVEL_PERMISSIONS } from "../permissions/novel-permission";

/**
 * Giao diện tạo tiểu thuyết mới.
 *
 * @returns FormPage tạo tiểu thuyết.
 */
export function NovelCreateView() {
  const t = useTranslations("novel.admin");
  const router = useRouter();
  const canCreate = usePermission(NOVEL_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <NovelForm onSaved={() => router.push(NOVEL_ROUTES.adminNovels)} />
    </FormPage>
  );
}
