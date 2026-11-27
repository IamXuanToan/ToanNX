"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { ChipItemParseResult } from "@/shares/components/common/hooks/use-chip-list-input";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useAssistantConfig } from "../../../hooks/use-assistant-config";
import { useSaveAssistantConfig } from "../../../hooks/use-save-assistant-config";
import {
  ASSISTANT_CONFIG_FORM_FIELDS,
  assistantConfigSchema,
  type AssistantConfigFormValues,
} from "../../../schemas/assistant-config.schema";
import type { AssistantConfig } from "../../../types/assistant.types";

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toDayChips(days?: number[] | null, fallback: number[] = []): string[] {
  return (days?.length ? days : fallback).map((d) => String(d));
}

function sortDaysDesc(items: string[]): string[] {
  return [...items].sort((a, b) => Number(b) - Number(a));
}

function sortTimeAsc(items: string[]): string[] {
  return [...items].sort();
}

function toFormValues(config: AssistantConfig): AssistantConfigFormValues {
  return {
    assistantName: config.assistantName || "",
    assistantAvatarId: config.assistantAvatar?.id ?? null,
    launcherSize:
      config.launcherSize === "sm" || config.launcherSize === "lg" ? config.launcherSize : "md",
    assistantSystemPrompt: config.assistantSystemPrompt || "",
    preferredAiModel: config.preferredAiModel || "",
    aiDailyTokenLimit: config.aiDailyTokenLimit !== null ? String(config.aiDailyTokenLimit) : "",
    telegramAiEnabled: config.telegramAiEnabled,
    telegramGroupRequireMention: config.telegramGroupRequireMention,
    telegramGroupToolPolicy:
      config.telegramGroupToolPolicy === "DISABLED" ||
      config.telegramGroupToolPolicy === "ALL_MEMBERS"
        ? config.telegramGroupToolPolicy
        : "OWNER_ONLY",
    telegramGroupHideAmounts: config.telegramGroupHideAmounts,
    telegramGroupReplyInDm: config.telegramGroupReplyInDm,
    digestTimeSlots: config.digestTimeSlots?.length ? config.digestTimeSlots : ["08:00"],
    digestSections: config.digestSections ?? ["reminders", "warranty", "subscriptions", "finance"],
    warrantyAlertDays: toDayChips(config.warrantyAlertDays, [30, 7, 1]),
    subscriptionDefaultAlertDays: toDayChips(config.subscriptionDefaultAlertDays, [7, 3, 1]),
  };
}

/**
 * State quản trị Chatbot AI dùng chung trên Admin (`/quan-tri/he-thong/tro-ly-ai`):
 * đồng bộ form Avatar/Tên/Kích thước nút tròn/Policy/Model/Telegram AI và trình chọn ảnh Thư viện.
 *
 * @param canReadConfig - Quyền đọc `workspace.assistant_config.read`.
 * @returns Query, form, avatar preview và handlers thao tác.
 */
export function useAssistantAdminPanel(canReadConfig: boolean) {
  const tValidation = useTranslations("workspace.validation");
  const tAdmin = useTranslations("workspace.assistantAdmin");
  const configQuery = useAssistantConfig(canReadConfig);
  const save = useSaveAssistantConfig();
  const errorMessage = useApiErrorMessage();

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickedAvatar, setPickedAvatar] = useState<{ id: string; url: string } | null>(null);

  const schema = useMemo(() => assistantConfigSchema(tValidation), [tValidation]);
  const defaults: AssistantConfigFormValues = {
    assistantName: "",
    assistantAvatarId: null,
    launcherSize: "md",
    assistantSystemPrompt: "",
    preferredAiModel: "",
    aiDailyTokenLimit: "",
    telegramAiEnabled: true,
    telegramGroupRequireMention: true,
    telegramGroupToolPolicy: "OWNER_ONLY",
    telegramGroupHideAmounts: false,
    telegramGroupReplyInDm: false,
    digestTimeSlots: ["08:00"],
    digestSections: ["reminders", "warranty", "subscriptions", "finance"],
    warrantyAlertDays: ["30", "7", "1"],
    subscriptionDefaultAlertDays: ["7", "3", "1"],
  };

  const form = useForm<AssistantConfigFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    values: configQuery.data ? toFormValues(configQuery.data) : undefined,
  });

  const assistantAvatarId = useWatch({ control: form.control, name: "assistantAvatarId" });
  const assistantName = useWatch({ control: form.control, name: "assistantName" });
  const digestTimeSlots = useWatch({ control: form.control, name: "digestTimeSlots" });
  const digestSections = useWatch({ control: form.control, name: "digestSections" });
  const warrantyAlertDays = useWatch({ control: form.control, name: "warrantyAlertDays" });
  const subscriptionDefaultAlertDays = useWatch({
    control: form.control,
    name: "subscriptionDefaultAlertDays",
  });

  const assistantAvatarUrl =
    assistantAvatarId === null
      ? null
      : pickedAvatar && pickedAvatar.id === assistantAvatarId
        ? pickedAvatar.url
        : configQuery.data?.assistantAvatar?.id === assistantAvatarId
          ? configQuery.data.assistantAvatar.url
          : null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        assistantName: values.assistantName,
        assistantAvatarId: values.assistantAvatarId,
        launcherSize: values.launcherSize,
        assistantSystemPrompt: values.assistantSystemPrompt,
        preferredAiModel: values.preferredAiModel,
        aiDailyTokenLimit: values.aiDailyTokenLimit ? Number(values.aiDailyTokenLimit) : null,
        telegramAiEnabled: values.telegramAiEnabled,
        telegramGroupRequireMention: values.telegramGroupRequireMention,
        telegramGroupToolPolicy: values.telegramGroupToolPolicy,
        telegramGroupHideAmounts: values.telegramGroupHideAmounts,
        telegramGroupReplyInDm: values.telegramGroupReplyInDm,
        digestTimeSlots: values.digestTimeSlots,
        digestSections: values.digestSections,
        warrantyAlertDays: values.warrantyAlertDays
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 365),
        subscriptionDefaultAlertDays: values.subscriptionDefaultAlertDays
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 365),
      });
      toast.success(tAdmin("saved"));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = ASSISTANT_CONFIG_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) {
        form.setError(name as keyof AssistantConfigFormValues, { message: fields[name] });
      }
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    configQuery,
    form,
    onSubmit,
    isSubmitting: save.isPending,
    libraryOpen,
    setLibraryOpen,
    assistantName: assistantName ?? "",
    assistantAvatarUrl,
    applyPreset: (promptText: string) => {
      form.setValue("assistantSystemPrompt", promptText, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    selectAvatar: (file: { id: string; url: string }) => {
      setPickedAvatar({ id: file.id, url: file.url });
      form.setValue("assistantAvatarId", file.id, { shouldDirty: true, shouldValidate: true });
      setLibraryOpen(false);
    },
    removeAvatar: () => {
      setPickedAvatar(null);
      form.setValue("assistantAvatarId", null, { shouldDirty: true, shouldValidate: true });
    },
    digestTimeSlots: digestTimeSlots ?? [],
    digestSections: digestSections ?? [],
    warrantyAlertDays: warrantyAlertDays ?? [],
    subscriptionDefaultAlertDays: subscriptionDefaultAlertDays ?? [],
    sortTimeAsc,
    sortDaysDesc,
    parseTimeSlot: (raw: string): ChipItemParseResult => {
      if (!HHMM_REGEX.test(raw)) {
        return { error: tValidation("timeSlot") };
      }
      return { value: raw };
    },
    parseAlertDay: (raw: string): ChipItemParseResult => {
      if (!/^\d+$/.test(raw)) {
        return { error: tValidation("alertDay") };
      }
      const day = Number(raw);
      if (day < 0 || day > 365) {
        return { error: tValidation("alertDay") };
      }
      return { value: String(day) };
    },
    toggleSection: (section: string, checked: boolean) => {
      const current = form.getValues("digestSections");
      const next = checked
        ? current.includes(section)
          ? current
          : [...current, section]
        : current.filter((item) => item !== section);
      form.setValue("digestSections", next, { shouldDirty: true, shouldValidate: true });
    },
  };
}
