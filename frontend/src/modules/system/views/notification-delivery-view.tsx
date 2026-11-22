"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { NotificationDeliveryTable } from "../components/notification-delivery-table";
import { usePermission } from "../hooks/use-permission";
import { NOTIFICATION_DELIVERY_PERMISSIONS } from "../permissions/notification-delivery-permission";

/** Trang Hệ thống → Nhật ký thông báo. */
export function NotificationDeliveryView() {
  const t = useTranslations("system.notifications.deliveries");
  const canRead = usePermission(NOTIFICATION_DELIVERY_PERMISSIONS.read);
  const canRetry = usePermission(NOTIFICATION_DELIVERY_PERMISSIONS.update);
  const canDelete = usePermission(NOTIFICATION_DELIVERY_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <NotificationDeliveryTable canRetry={canRetry} canDelete={canDelete} />
    </div>
  );
}
