"use client";

import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AnnouncementForm } from "../components/announcement-form";
import { usePermission } from "../hooks/use-permission";
import { ANNOUNCEMENT_PERMISSIONS } from "../permissions/announcement-permission";

/** Trang gửi thông báo hệ thống. */
export function AnnouncementCreateView() {
  const t = useTranslations("system.notifications.announcements");
  if (!usePermission(ANNOUNCEMENT_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <AnnouncementForm />
    </FormPage>
  );
}
