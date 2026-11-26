"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { useTelegramChats } from "@/modules/system/hooks/use-telegram-chats";
import { TELEGRAM_CHAT_PERMISSIONS } from "@/modules/system/permissions/telegram-chat-permission";
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

function toFormValues(s: WorkspaceSetting): WorkspaceSettingFormValues {
  return {
    timezone: s.timezone || DEFAULT_WORKSPACE_TIMEZONE,
    dailyDigestEnabled: s.dailyDigestEnabled,
    digestTimeSlots: s.digestTimeSlots ?? ["08:00"],
    digestSections: s.digestSections ?? ["reminders", "monitors", "finance"],
    warrantyAlertDaysText: (s.warrantyAlertDays ?? [30, 7, 1]).join(", "),
    subscriptionDefaultAlertDaysText: (s.subscriptionDefaultAlertDays ?? [7, 3, 1]).join(", "),
    preferredAiModel: s.preferredAiModel || "",
    aiDailyTokenLimit: s.aiDailyTokenLimit !== null ? String(s.aiDailyTokenLimit) : "",
    telegramAiEnabled: s.telegramAiEnabled,
    telegramAllowedChatIds: s.telegramAllowedChatIds ?? [],
    telegramGroupRequireMention: s.telegramGroupRequireMention,
    telegramGroupToolPolicy: s.telegramGroupToolPolicy,
    telegramGroupHideAmounts: s.telegramGroupHideAmounts,
    telegramGroupReplyInDm: s.telegramGroupReplyInDm,
  };
}

function parseDaysCsv(raw: string): number[] {
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x));
}

/** @returns Query & form state Cài đặt Digest, AI & Telegram hai chiều. */
export function useWorkspaceSettingForm() {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const settingQuery = useWorkspaceSetting();
  const save = useSaveWorkspaceSetting();
  const canReadChats = usePermission(TELEGRAM_CHAT_PERMISSIONS.read);
  const telegramChatsQuery = useTelegramChats(canReadChats);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => workspaceSettingSchema(tValidation), [tValidation]);
  const [slotInput, setSlotInput] = useState("");

  const defaults: WorkspaceSettingFormValues = {
    timezone: DEFAULT_WORKSPACE_TIMEZONE,
    dailyDigestEnabled: true,
    digestTimeSlots: ["08:00"],
    digestSections: ["reminders", "warranty", "subscriptions", "monitors", "finance"],
    warrantyAlertDaysText: "30, 7, 1",
    subscriptionDefaultAlertDaysText: "7, 3, 1",
    preferredAiModel: "",
    aiDailyTokenLimit: "",
    telegramAiEnabled: false,
    telegramAllowedChatIds: [],
    telegramGroupRequireMention: true,
    telegramGroupToolPolicy: "OWNER_ONLY",
    telegramGroupHideAmounts: true,
    telegramGroupReplyInDm: false,
  };

  const form = useForm<WorkspaceSettingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    values: settingQuery.data ? toFormValues(settingQuery.data) : undefined,
  });

  const digestTimeSlots = useWatch({ control: form.control, name: "digestTimeSlots" });
  const digestSections = useWatch({ control: form.control, name: "digestSections" });
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
        warrantyAlertDays: parseDaysCsv(values.warrantyAlertDaysText),
        subscriptionDefaultAlertDays: parseDaysCsv(values.subscriptionDefaultAlertDaysText),
        preferredAiModel: values.preferredAiModel,
        aiDailyTokenLimit: values.aiDailyTokenLimit ? Number(values.aiDailyTokenLimit) : null,
        telegramAiEnabled: values.telegramAiEnabled,
        telegramAllowedChatIds: values.telegramAllowedChatIds,
        telegramGroupRequireMention: values.telegramGroupRequireMention,
        telegramGroupToolPolicy: values.telegramGroupToolPolicy,
        telegramGroupHideAmounts: values.telegramGroupHideAmounts,
        telegramGroupReplyInDm: values.telegramGroupReplyInDm,
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

  return {
    settingQuery,
    telegramChats: telegramChatsQuery.data ?? [],
    form,
    onSubmit,
    isSubmitting: save.isPending,
    slotInput,
    setSlotInput,
    digestTimeSlots: digestTimeSlots ?? [],
    digestSections: digestSections ?? [],
    telegramAllowedChatIds: telegramAllowedChatIds ?? [],
    addSlot: () => {
      const clean = slotInput.trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clean)) {
        form.setError("digestTimeSlots", { message: tValidation("timeSlot") });
        return;
      }
      form.clearErrors("digestTimeSlots");
      const current = form.getValues("digestTimeSlots");
      if (!current.includes(clean)) {
        form.setValue("digestTimeSlots", [...current, clean].sort(), { shouldDirty: true });
      }
      setSlotInput("");
    },
    removeSlot: (slot: string) => {
      const next = form.getValues("digestTimeSlots").filter((s) => s !== slot);
      form.setValue("digestTimeSlots", next, { shouldDirty: true });
    },
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
