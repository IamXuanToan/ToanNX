"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { ReminderTable } from "../../components/reminder/reminder-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { REMINDER_PERMISSIONS } from "../../permissions/reminder-permission";

/** @returns Trang danh sách Nhắc việc cá nhân. */
export function ReminderListView() {
  const t = useTranslations("workspace.reminders");
  const canRead = usePermission(REMINDER_PERMISSIONS.read);
  const canCreate = usePermission(REMINDER_PERMISSIONS.create);
  const canUpdate = usePermission(REMINDER_PERMISSIONS.update);
  const canDelete = usePermission(REMINDER_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.reminderCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <ReminderTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
