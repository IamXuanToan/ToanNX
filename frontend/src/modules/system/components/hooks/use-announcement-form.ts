"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { parseDateTimeLocal } from "@/shares/lib/date-time-input";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useCreateAnnouncement } from "../../hooks/use-create-announcement";
import { useRoleOptions } from "../../hooks/use-role-options";
import { announcementSchema, type AnnouncementFormValues } from "../../schemas/announcement.schema";

/** @returns Form gửi thông báo hệ thống + lựa chọn vai trò. */
export function useAnnouncementForm() {
  const t = useTranslations("system.notifications.announcements.validation");
  const router = useRouter();
  const create = useCreateAnnouncement();
  const roles = useRoleOptions();
  const schema = useMemo(() => announcementSchema(t), [t]);
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      body: "",
      level: "INFO",
      link: "",
      target: "ALL",
      roleIds: [],
      expiresAt: "",
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    const expires = parseDateTimeLocal(values.expiresAt);
    await create.mutateAsync({ ...values, expiresAt: expires ? expires.toISOString() : null });
    router.push(SYSTEM_ROUTES.announcements);
  });
  return { form, onSubmit, isSubmitting: create.isPending, roleOptions: roles };
}
