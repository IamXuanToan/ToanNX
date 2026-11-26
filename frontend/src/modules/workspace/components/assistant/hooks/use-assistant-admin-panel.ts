"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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

function toFormValues(config: AssistantConfig): AssistantConfigFormValues {
  return {
    assistantName: config.assistantName || "",
    assistantAvatarId: config.assistantAvatar?.id ?? null,
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
  };
}

/**
 * State quản trị Chatbot AI dùng chung trên Admin (`/quan-tri/he-thong/tro-ly-ai`):
 * đồng bộ form Avatar/Tên/Policy/Model/Telegram AI và trình chọn ảnh Thư viện.
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
    assistantSystemPrompt: "",
    preferredAiModel: "",
    aiDailyTokenLimit: "",
    telegramAiEnabled: true,
    telegramGroupRequireMention: true,
    telegramGroupToolPolicy: "OWNER_ONLY",
    telegramGroupHideAmounts: false,
    telegramGroupReplyInDm: false,
  };

  const form = useForm<AssistantConfigFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    values: configQuery.data ? toFormValues(configQuery.data) : undefined,
  });

  const assistantAvatarId = useWatch({ control: form.control, name: "assistantAvatarId" });
  const assistantName = useWatch({ control: form.control, name: "assistantName" });

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
        assistantSystemPrompt: values.assistantSystemPrompt,
        preferredAiModel: values.preferredAiModel,
        aiDailyTokenLimit: values.aiDailyTokenLimit ? Number(values.aiDailyTokenLimit) : null,
        telegramAiEnabled: values.telegramAiEnabled,
        telegramGroupRequireMention: values.telegramGroupRequireMention,
        telegramGroupToolPolicy: values.telegramGroupToolPolicy,
        telegramGroupHideAmounts: values.telegramGroupHideAmounts,
        telegramGroupReplyInDm: values.telegramGroupReplyInDm,
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
  };
}
