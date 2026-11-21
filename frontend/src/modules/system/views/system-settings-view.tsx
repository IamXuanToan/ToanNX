"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { SettingSocialAuthCard } from "../components/setting-social-auth-card";
import { SettingTable } from "../components/setting-table";
import { SETTING_PERMISSIONS } from "../permissions/setting-permission";

/**
 * Trang quản lý cấu hình hệ thống:
 * - Khối cấu hình bật/tắt nhanh đăng nhập mạng xã hội (Google & GitHub).
 * - Bảng danh sách các tham số cấu hình hệ thống và thao tác chỉnh sửa giá trị.
 *
 * @returns Giao diện quản lý cấu hình hệ thống.
 */
export function SystemSettingsView() {
  const t = useTranslations("system.settings");
  const canUpdate = usePermission(SETTING_PERMISSIONS.settingUpdate);

  return (
    <PermissionGate permission={SETTING_PERMISSIONS.settingRead} fallback={<ForbiddenView />}>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />

        {/* Khối quản lý trạng thái phương thức đăng nhập mạng xã hội */}
        <SettingSocialAuthCard canUpdate={canUpdate} />

        {/* Bảng danh sách chi tiết các tham số cấu hình */}
        <SettingTable canUpdate={canUpdate} />
      </div>
    </PermissionGate>
  );
}
