"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission-gate";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PermissionCatalog } from "../components/permission-catalog";
import { IAM_PERMISSIONS } from "../permissions/iam-permission";

/** @returns Trang danh mục quyền chỉ đọc, không có CRUD hoặc điều hướng vào chi tiết. */
export function PermissionListView() {
  const t = useTranslations("system.iam.permissions");
  return (
    <PermissionGate permission={IAM_PERMISSIONS.permissionRead} fallback={<ForbiddenView />}>
      <div className="space-y-6">
        <PageHeader title={t("title")} />
        <PermissionCatalog />
      </div>
    </PermissionGate>
  );
}
