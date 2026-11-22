"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { AnnouncementTable } from "../../components/announcement/announcement-table";
import { PermissionGate } from "../../components/permission/permission-gate";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { ANNOUNCEMENT_PERMISSIONS } from "../../permissions/announcement-permission";

/** Trang Hệ thống → Gửi thông báo. */
export function AnnouncementListView() {
  const t = useTranslations("system.notifications.announcements");
  const canRead = usePermission(ANNOUNCEMENT_PERMISSIONS.read);
  const canDelete = usePermission(ANNOUNCEMENT_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.create}>
            <Button asChild>
              <Link href={SYSTEM_ROUTES.announcementCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <AnnouncementTable canDelete={canDelete} />
    </div>
  );
}
