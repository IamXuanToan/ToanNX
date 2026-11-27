"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { financeKeys } from "../../../constants/query-keys";
import { useClassificationRules } from "../../../hooks/use-classification-rules";
import {
  platformRuleSchema,
  type PlatformRuleFormValues,
} from "../../../schemas/classification-rule.schema";
import { classificationRuleService } from "../../../services/classification-rule.service";
import type {
  ClassificationRule,
  DraftClassificationRule,
} from "../../../types/classification-rule.types";

const EMPTY_FORM: PlatformRuleFormValues = {
  name: "",
  pattern: "",
  priority: "100",
  isActive: true,
};

function nextDraftLocalId(items: DraftClassificationRule[]): string {
  const maxIndex = items.reduce((max, item) => {
    const matched = /^draft-(\d+)$/.exec(item.localId);
    const num = matched ? Number(matched[1]) : 0;
    return num > max ? num : max;
  }, 0);
  return `draft-${maxIndex + 1}`;
}

export type PlatformRuleRow = {
  id: string;
  name: string;
  pattern: string;
  priority: number;
  isActive: boolean;
  isDraft: boolean;
};

/**
 * State cho Popup quản lý Quy tắc phân loại theo Nền tảng:
 * hỗ trợ thêm (`+`), sửa, bật/tắt, kiểm thử regex (`RuleTester`) và xóa
 * cả với Nền tảng đã lưu (gọi API) lẫn Nền tảng đang tạo mới (danh sách nháp đồng bộ khi submit).
 *
 * @param props - Trạng thái dialog, ID nền tảng (nếu đã lưu), danh sách nháp & cờ quyền.
 * @returns Danh sách quy tắc, state editor, xác nhận xóa & mutation handlers.
 */
export function usePlatformRulesDialog({
  open,
  platformId,
  draftRules = [],
  onDraftRulesChange,
}: {
  open: boolean;
  platformId?: string;
  draftRules?: DraftClassificationRule[];
  onDraftRulesChange?: (next: DraftClassificationRule[]) => void;
}) {
  const tValidation = useTranslations("finance.validation");
  const tRules = useTranslations("finance.rules");
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();

  const isSavedPlatform = Boolean(platformId);
  const rulesQuery = useClassificationRules(
    { platform: platformId, pageSize: 100, ordering: "-priority" },
    { enabled: open && isSavedPlatform },
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformRuleRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const schema = useMemo(() => platformRuleSchema(tValidation), [tValidation]);
  const form = useForm<PlatformRuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
  });
  const watchedPattern = useWatch({ control: form.control, name: "pattern" });

  const rules: PlatformRuleRow[] = isSavedPlatform
    ? (rulesQuery.data?.items ?? []).map((item: ClassificationRule) => ({
        id: item.id,
        name: item.name,
        pattern: item.pattern,
        priority: item.priority,
        isActive: item.isActive,
        isDraft: false,
      }))
    : draftRules.map((item) => ({
        id: item.localId,
        name: item.name,
        pattern: item.pattern,
        priority: item.priority,
        isActive: item.isActive,
        isDraft: true,
      }));

  function openCreate() {
    setEditingId(null);
    form.reset(EMPTY_FORM);
    form.clearErrors();
    setEditorOpen(true);
  }

  function openEdit(row: PlatformRuleRow) {
    setEditingId(row.id);
    form.reset({
      name: row.name,
      pattern: row.pattern,
      priority: String(row.priority),
      isActive: row.isActive,
    });
    form.clearErrors();
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    form.reset(EMPTY_FORM);
    form.clearErrors();
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const priority = Number(values.priority);
    if (!isSavedPlatform) {
      if (editingId) {
        onDraftRulesChange?.(
          draftRules.map((item) =>
            item.localId === editingId
              ? {
                  ...item,
                  name: values.name.trim(),
                  pattern: values.pattern.trim(),
                  priority,
                  isActive: values.isActive,
                }
              : item,
          ),
        );
      } else {
        onDraftRulesChange?.([
          ...draftRules,
          {
            localId: nextDraftLocalId(draftRules),
            name: values.name.trim(),
            pattern: values.pattern.trim(),
            priority,
            isActive: values.isActive,
          },
        ]);
      }
      toast.success(tRules("draftCreatedHint"));
      closeEditor();
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        platformId,
        pattern: values.pattern.trim(),
        priority,
        isActive: values.isActive,
      };
      if (editingId) {
        await classificationRuleService.update(editingId, payload);
      } else {
        await classificationRuleService.create(payload);
      }
      await queryClient.invalidateQueries({ queryKey: financeKeys.all });
      toast.success(tRules("savedNotice"));
      closeEditor();
    } catch (error) {
      const PLATFORM_RULE_FIELDS: readonly (keyof PlatformRuleFormValues)[] = [
        "name",
        "pattern",
        "priority",
      ];
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = PLATFORM_RULE_FIELDS.filter((name) => Boolean(fields[name]));
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  });

  async function toggleActive(row: PlatformRuleRow, checked: boolean) {
    if (!isSavedPlatform) {
      onDraftRulesChange?.(
        draftRules.map((item) => (item.localId === row.id ? { ...item, isActive: checked } : item)),
      );
      return;
    }
    setTogglingId(row.id);
    try {
      await classificationRuleService.update(row.id, { isActive: checked });
      await queryClient.invalidateQueries({ queryKey: financeKeys.all });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setTogglingId(null);
    }
  }

  function requestDelete(row: PlatformRuleRow) {
    if (!isSavedPlatform) {
      onDraftRulesChange?.(draftRules.filter((item) => item.localId !== row.id));
      if (editingId === row.id) closeEditor();
      toast.success(tRules("deletedNotice"));
      return;
    }
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await classificationRuleService.delete(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: financeKeys.all });
      if (editingId === deleteTarget.id) closeEditor();
      setDeleteTarget(null);
      toast.success(tRules("deletedNotice"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    isSavedPlatform,
    rulesQuery,
    rules,
    editorOpen,
    editingId,
    openCreate,
    openEdit,
    closeEditor,
    form,
    watchedPattern,
    onSubmit,
    isSaving,
    togglingId,
    toggleActive,
    deleteTarget,
    setDeleteTarget,
    requestDelete,
    confirmDelete,
    isDeleting,
  };
}
