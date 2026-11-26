"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { MonitorTargetForm } from "../../components/monitor-target/monitor-target-form";
import { MONITOR_TARGET_PERMISSIONS } from "../../permissions/monitor-target-permission";

/** @returns Trang tạo Endpoint giám sát Uptime mới. */
export function MonitorTargetCreateView() {
  const t = useTranslations("workspace.monitors");
  const canCreate = usePermission(MONITOR_TARGET_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <MonitorTargetForm />
    </FormPage>
  );
}
