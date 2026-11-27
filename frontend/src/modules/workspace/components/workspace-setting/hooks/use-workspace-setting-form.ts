"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { useTelegramChats } from "@/modules/system/hooks/use-telegram-chats";
import { TELEGRAM_CHAT_PERMISSIONS } from "@/modules/system/permissions/telegram-chat-permission";
import type { ChipItemParseResult } from "@/shares/components/common/hooks/use-chip-list-input";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { DEFAULT_WORKSPACE_TIMEZONE } from "../../../constants/defaults";
import { useSaveWorkspaceSetting } from "../../../hooks/use-save-workspace-setting";
import { useWorkspaceSetting } from "../../../hooks/use-workspace-setting";
import {
  WORKSPACE_SETTING_FORM_FIELDS,
  workspaceSettingSchema,
  type WorkspaceSettingFormValues,
} from "../../../schemas/workspace-setting.schema";
import type { WorkspaceSetting } from "../../../types/workspace-setting.types";

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toDayChips(days?: number[] | null, fallback: number[] = []): string[] {
  return (days?.length ? days : fallback).map((d) => String(d));
}

function toFormValues(s: WorkspaceSetting): WorkspaceSettingFormValues {
  return {
    timezone: s.timezone || DEFAULT_WORKSPACE_TIMEZONE,
    dailyDigestEnabled: s.dailyDigestEnabled,
    digestTimeSlots: s.digestTimeSlots ?? ["08:00"],
    digestSections: s.digestSections ?? ["reminders", "warranty", "subscriptions", "finance"],
    warrantyAlertDays: toDayChips(s.warrantyAlertDays, [30, 7, 1]),
    subscriptionDefaultAlertDays: toDayChips(s.subscriptionDefaultAlertDays, [7, 3, 1]),
    telegramAllowedChatIds: s.telegramAllowedChatIds ?? [],
  };
}

function sortDaysDesc(items: string[]): string[] {
  return [...items].sort((a, b) => Number(b) - Number(a));
}

function sortTimeAsc(items: string[]): string[] {
  return [...items].sort();
}

/**
 * Query & form state Cài đặt cá nhân (Múi giờ, Digest, mốc cảnh báo dạng chip & Telegram nhận tin).
 *
 * @returns State form, parser chip và thao tác danh sách phần/chat Telegram.
 */
export function useWorkspaceSettingForm() {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const settingQuery = useWorkspaceSetting(undefined, true);
  const save = useSaveWorkspaceSetting();
  const canReadChats = usePermission(TELEGRAM_CHAT_PERMISSIONS.read);
  const telegramChatsQuery = useTelegramChats(canReadChats);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => workspaceSettingSchema(tValidation), [tValidation]);

  const defaults: WorkspaceSettingFormValues = {
    timezone: DEFAULT_WORKSPACE_TIMEZONE,
    dailyDigestEnabled: true,
    digestTimeSlots: ["08:00"],
    digestSections: ["reminders", "warranty", "subscriptions", "finance"],
    warrantyAlertDays: ["30", "7", "1"],
    subscriptionDefaultAlertDays: ["7", "3", "1"],
    telegramAllowedChatIds: [],
  };

  const form = useForm<WorkspaceSettingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    values: settingQuery.data ? toFormValues(settingQuery.data) : undefined,
  });

  const digestTimeSlots = useWatch({ control: form.control, name: "digestTimeSlots" });
  const digestSections = useWatch({ control: form.control, name: "digestSections" });
  const warrantyAlertDays = useWatch({ control: form.control, name: "warrantyAlertDays" });
  const subscriptionDefaultAlertDays = useWatch({
    control: form.control,
    name: "subscriptionDefaultAlertDays",
  });
  const telegramAllowedChatIds = useWatch({
    control: form.control,
    name: "telegramAllowedChatIds",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        timezone: values.timezone,
        dailyDigestEnabled: values.dailyDigestEnabled,
        digestTimeSlots: values.digestTimeSlots,
        digestSections: values.digestSections,
        warrantyAlertDays: values.warrantyAlertDays.map((x) => Number(x)),
        subscriptionDefaultAlertDays: values.subscriptionDefaultAlertDays.map((x) => Number(x)),
        telegramAllowedChatIds: values.telegramAllowedChatIds,
      });
      toast.success(tCommon("updated"));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = WORKSPACE_SETTING_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched)
        form.setError(name as keyof WorkspaceSettingFormValues, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  const parseTimeSlot = (raw: string): ChipItemParseResult => {
    const clean = raw.trim();
    if (!HHMM_REGEX.test(clean)) return { error: tValidation("timeSlot") };
    return { value: clean };
  };

  const parseAlertDay = (raw: string): ChipItemParseResult => {
    const clean = raw.trim();
    if (!/^\d+$/.test(clean)) return { error: tValidation("alertDay") };
    const num = Number(clean);
    if (num < 0 || num > 365) return { error: tValidation("alertDay") };
    return { value: String(num) };
  };

  return {
    settingQuery,
    telegramChats: telegramChatsQuery.data ?? [],
    form,
    onSubmit,
    isSubmitting: save.isPending,
    digestTimeSlots: digestTimeSlots ?? [],
    digestSections: digestSections ?? [],
    warrantyAlertDays: warrantyAlertDays ?? [],
    subscriptionDefaultAlertDays: subscriptionDefaultAlertDays ?? [],
    telegramAllowedChatIds: telegramAllowedChatIds ?? [],
    parseTimeSlot,
    parseAlertDay,
    sortTimeAsc,
    sortDaysDesc,
    toggleSection: (section: string, checked: boolean) => {
      const current = form.getValues("digestSections");
      const next = checked
        ? [...new Set([...current, section])]
        : current.filter((item) => item !== section);
      form.setValue("digestSections", next, { shouldDirty: true });
    },
    toggleChatId: (chatUuid: string, checked: boolean) => {
      const current = form.getValues("telegramAllowedChatIds");
      const next = checked
        ? [...new Set([...current, chatUuid])]
        : current.filter((item) => item !== chatUuid);
      form.setValue("telegramAllowedChatIds", next, { shouldDirty: true });
    },
  };
}
