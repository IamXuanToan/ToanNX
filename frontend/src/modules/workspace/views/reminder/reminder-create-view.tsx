"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ReminderForm } from "../../components/reminder/reminder-form";
import { REMINDER_PERMISSIONS } from "../../permissions/reminder-permission";

/** @returns Trang tạo Nhắc việc cá nhân mới. */
export function ReminderCreateView() {
  const t = useTranslations("workspace.reminders");
  const canCreate = usePermission(REMINDER_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <ReminderForm />
    </FormPage>
  );
}
