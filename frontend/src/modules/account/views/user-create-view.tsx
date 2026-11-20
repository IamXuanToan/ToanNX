"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { UserForm } from "../components/user-form";
import { USER_PERMISSIONS } from "../permissions/user-permission";

/**
 * Trang tạo người dùng (có thể sao chép từ người dùng khác).
 *
 * @param props - Id người dùng nguồn khi sao chép; phần mở rộng của module khác (page ghép).
 * @returns Giao diện tạo người dùng, hoặc màn không có quyền.
 */
export function UserCreateView({
  copyFrom,
  extensions,
}: {
  copyFrom?: string;
  extensions?: ReactNode;
}) {
  const t = useTranslations("account.users");
  const canCreate = usePermission(USER_PERMISSIONS.userCreate);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <UserForm copyFrom={copyFrom} extensions={extensions} />
    </FormPage>
  );
}
