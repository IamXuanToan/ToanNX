"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useDeleteReminderTopic } from "../../../hooks/use-delete-reminder-topic";
import { useReminderTopics } from "../../../hooks/use-reminder-topics";
import { useSaveReminderTopic } from "../../../hooks/use-save-reminder-topic";
import { REMINDER_TOPIC_PERMISSIONS } from "../../../permissions/reminder-topic-permission";
import type { ReminderTopic } from "../../../types/reminder-topic.types";

/** Bảng màu gợi ý cho Chủ đề nhắc việc. */
export const REMINDER_TOPIC_COLORS = [
  "#2563EB",
  "#D97706",
  "#475569",
  "#EC4899",
  "#8B5CF6",
  "#16A34A",
  "#059669",
  "#DC2626",
] as const;

const DEFAULT_TOPIC_COLOR = REMINDER_TOPIC_COLORS[0];

/**
 * State quản lý chọn nhanh & Dialog CRUD Chủ đề nhắc việc ngay trong form Nhắc việc.
 *
 * @param onSelectTopic - Callback gắn chủ đề vừa tạo/chọn vào form Nhắc việc.
 * @returns Danh sách chủ đề, state dialog và thao tác CRUD chủ đề cá nhân.
 */
export function useReminderTopicManager(onSelectTopic?: (topicId: string) => void) {
  const t = useTranslations("workspace.reminders.topicManager");
  const tCommon = useTranslations("workspace.common");
  const errorMessage = useApiErrorMessage();

  const canRead = usePermission(REMINDER_TOPIC_PERMISSIONS.read);
  const canCreate = usePermission(REMINDER_TOPIC_PERMISSIONS.create);
  const canUpdate = usePermission(REMINDER_TOPIC_PERMISSIONS.update);
  const canDelete = usePermission(REMINDER_TOPIC_PERMISSIONS.delete);

  const query = useReminderTopics({ pageSize: 100 }, { enabled: canRead });
  const topics = useMemo(() => query.data?.items ?? [], [query.data]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderTopic | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TOPIC_COLOR);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useSaveReminderTopic(editing?.id);
  const deleteMutation = useDeleteReminderTopic();

  const resetEditor = () => {
    setEditing(null);
    setName("");
    setColor(DEFAULT_TOPIC_COLOR);
    setFormError(null);
  };

  const openDialog = () => {
    resetEditor();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetEditor();
  };

  const startEdit = (topic: ReminderTopic) => {
    setEditing(topic);
    setName(topic.name);
    setColor(topic.color || DEFAULT_TOPIC_COLOR);
    setFormError(null);
  };

  const submitTopic = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError(t("nameRequired"));
      return;
    }
    setFormError(null);
    try {
      const saved = await saveMutation.mutateAsync({
        name: trimmed,
        color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_TOPIC_COLOR,
      });
      toast.success(tCommon(editing ? "updated" : "created"));
      if (!editing && onSelectTopic) {
        onSelectTopic(saved.id);
      }
      resetEditor();
    } catch (error) {
      const fieldMsg = isApiError(error) ? error.fieldErrors().name : undefined;
      setFormError(fieldMsg || errorMessage(error));
    }
  };

  const removeTopic = async (topic: ReminderTopic) => {
    await deleteMutation.mutateAsync(topic.id);
    if (editing?.id === topic.id) resetEditor();
  };

  return {
    topics,
    isLoading: query.isPending,
    canCreate,
    canUpdate,
    canDelete,
    dialogOpen,
    setDialogOpen,
    openDialog,
    closeDialog,
    editing,
    name,
    setName,
    color,
    setColor,
    formError,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    resetEditor,
    startEdit,
    submitTopic,
    removeTopic,
  };
}
