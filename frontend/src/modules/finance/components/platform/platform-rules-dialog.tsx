"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { NumberInput } from "@/shares/components/common/number-input";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Switch } from "@/shares/components/ui/switch";

import type { DraftClassificationRule } from "../../types/classification-rule.types";
import { RuleTester } from "../classification-rule/rule-tester";
import { usePlatformRulesDialog } from "./hooks/use-platform-rules-dialog";

/**
 * Hộp thoại phím tắt `+` quản lý Quy tắc phân loại gắn trực tiếp với Nền tảng:
 * cho phép xem danh sách, thêm mới (`+`), sửa, bật/tắt, thử regex và xóa ngay trong popup.
 *
 * @param props - Trạng thái mở, nền tảng mục tiêu (hoặc nháp khi tạo mới) & cờ quyền.
 * @returns Dialog quản lý quy tắc phân loại của nền tảng.
 */
export function PlatformRulesDialog({
  open,
  onOpenChange,
  platformId,
  platformName,
  draftRules,
  onDraftRulesChange,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformId?: string;
  platformName?: string;
  draftRules?: DraftClassificationRule[];
  onDraftRulesChange?: (next: DraftClassificationRule[]) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("finance.rules");
  const tPlatforms = useTranslations("finance.platforms");
  const tActions = useTranslations("common.actions");
  const tTable = useTranslations("common.table");
  const state = usePlatformRulesDialog({
    open,
    platformId,
    draftRules,
    onDraftRulesChange,
  });
  const { form } = state;
  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
          data-testid="platform-rules-dialog"
        >
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
              <div className="space-y-1">
                <DialogTitle>
                  {t("dialogTitle", { platform: platformName?.trim() || tPlatforms("title") })}
                </DialogTitle>
                <DialogDescription>{t("dialogSubtitle")}</DialogDescription>
              </div>
              {canCreate && !state.editorOpen ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={state.openCreate}
                  data-testid="add-rule-btn"
                >
                  <Plus />
                  {t("newRuleButton")}
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {state.editorOpen ? (
              <div className="border-primary/30 bg-muted/20 rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">
                    {state.editingId ? tActions("edit") : t("newRuleButton")}
                  </h4>
                  <Button type="button" variant="ghost" size="sm" onClick={state.closeEditor}>
                    <X />
                    {t("cancelEdit")}
                  </Button>
                </div>

                <Form onSubmit={state.onSubmit} className="space-y-4">
                  {rootError ? (
                    <p role="alert" className="text-destructive text-sm">
                      {rootError}
                    </p>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="name"
                        label={t("fields.name")}
                        required
                      >
                        {(field) => (
                          <Input
                            {...field}
                            maxLength={150}
                            disabled={state.isSaving}
                            className="h-10"
                            autoFocus
                          />
                        )}
                      </FormField>
                    </div>
                    <FormField
                      control={form.control}
                      name="priority"
                      label={t("fields.priority")}
                      required
                    >
                      {(field) => (
                        <NumberInput
                          value={field.value}
                          onChange={(value) => field.onChange(String(value))}
                          integer
                          disabled={state.isSaving}
                          className="h-10"
                        />
                      )}
                    </FormField>
                  </div>

                  <FormField
                    control={form.control}
                    name="pattern"
                    label={t("fields.pattern")}
                    description={t("fields.patternHint")}
                    required
                  >
                    {(field) => (
                      <Input
                        {...field}
                        className="h-10 font-mono"
                        maxLength={500}
                        disabled={state.isSaving}
                      />
                    )}
                  </FormField>

                  <div className="bg-card rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold">{t("tester.title")}</p>
                    <RuleTester pattern={state.watchedPattern} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            id="platform-rule-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={state.isSaving}
                          />
                        )}
                      />
                      <Label htmlFor="platform-rule-active">{t("fields.isActive")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={state.closeEditor}
                        disabled={state.isSaving}
                      >
                        {tActions("cancel")}
                      </Button>
                      <Button type="submit" size="sm" disabled={state.isSaving}>
                        {tActions("save")}
                      </Button>
                    </div>
                  </div>
                </Form>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {t("ruleListTitle", { count: state.rules.length })}
              </h4>

              {state.isSavedPlatform && state.rulesQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : state.isSavedPlatform && state.rulesQuery.isError ? (
                <QueryErrorState
                  error={state.rulesQuery.error}
                  onRetry={() => state.rulesQuery.refetch()}
                />
              ) : state.rules.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
                  {t("empty")}
                </div>
              ) : (
                <ul className="space-y-2">
                  {state.rules.map((row) => (
                    <li
                      key={row.id}
                      className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{row.name}</span>
                          <Badge variant="outline" className="text-[11px] tabular-nums">
                            #{row.priority}
                          </Badge>
                        </div>
                        <code className="text-muted-foreground block truncate font-mono text-xs">
                          {row.pattern}
                        </code>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          checked={row.isActive}
                          onCheckedChange={(checked) => void state.toggleActive(row, checked)}
                          disabled={!canUpdate || state.togglingId === row.id}
                          aria-label={t("fields.isActive")}
                        />
                        {canUpdate ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => state.openEdit(row)}
                            aria-label={tActions("edit")}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive size-8"
                            onClick={() => state.requestDelete(row)}
                            aria-label={tTable("delete")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t px-6 py-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tActions("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(state.deleteTarget)}
        onOpenChange={(next) => {
          if (!next) state.setDeleteTarget(null);
        }}
        title={tTable("delete")}
        description={
          state.deleteTarget ? t("deleteConfirm", { name: state.deleteTarget.name }) : ""
        }
        confirmLabel={tTable("delete")}
        onConfirm={() => void state.confirmDelete()}
        isPending={state.isDeleting}
      />
    </>
  );
}
