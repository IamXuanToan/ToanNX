"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { WorkspaceSettingForm } from "../../components/workspace-setting/workspace-setting-form";
import { WORKSPACE_SETTING_PERMISSIONS } from "../../permissions/workspace-setting-permission";

/** @returns Trang Cài đặt Digest, Mốc cảnh báo & Chat Telegram cá nhân. */
export function WorkspaceSettingView() {
  const t = useTranslations("workspace.settings");
  const canRead = usePermission(WORKSPACE_SETTING_PERMISSIONS.read);
  const canUpdate = usePermission(WORKSPACE_SETTING_PERMISSIONS.update);

  if (!canRead) return <ForbiddenView />;

  return (
    <FormPage title={t("title")}>
      <p className="text-muted-foreground mb-4 text-sm">{t("subtitle")}</p>
      <WorkspaceSettingForm canUpdate={canUpdate} />
    </FormPage>
  );
}
