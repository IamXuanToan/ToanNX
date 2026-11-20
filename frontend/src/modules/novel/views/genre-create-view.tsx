/**
 * Trang tạo thể loại mới (`/admin/genres/new`).
 */

"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { GenreForm } from "../components/genre-form";
import { NOVEL_ROUTES } from "../constants/routes";
import { GENRE_PERMISSIONS } from "../permissions/genre-permission";

/**
 * Giao diện tạo thể loại mới.
 *
 * @returns Khối giao diện form tạo thể loại.
 */
export function GenreCreateView() {
  const t = useTranslations("novel.genres");
  const router = useRouter();
  const canCreate = usePermission(GENRE_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <GenreForm onSaved={() => router.push(NOVEL_ROUTES.adminGenres)} />
    </FormPage>
  );
}
