"use client";

import { Check, FolderCog, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { SelectField, type SelectOption } from "@/shares/components/common/select-field";
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

import { REMINDER_TOPIC_COLORS, useReminderTopicManager } from "./hooks/use-reminder-topic-manager";

const EMPTY_TOPIC_VALUE = "__none__";

/**
 * Ô chọn Chủ đề nhắc việc dùng `SelectField` chuẩn có tìm kiếm, kèm nút mở Dialog quản lý chủ đề kích thước lớn.
 *
 * @param props - ID control, giá trị `topicId` hiện tại, callback đổi và trạng thái khóa form.
 * @returns Select có search + Dialog quản lý chủ đề.
 */
export function ReminderTopicSelect({
  id,
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const t = useTranslations("workspace.reminders");
  const tm = useTranslations("workspace.reminders.topicManager");
  const mgr = useReminderTopicManager((newTopicId) => onChange(newTopicId));

  const options: SelectOption[] = [
    { value: EMPTY_TOPIC_VALUE, label: t("topicNone") },
    ...mgr.topics.map((topic) => ({
      value: topic.id,
      label: topic.name,
      color: topic.color,
      description: topic.isSystem ? tm("systemBadge") : undefined,
    })),
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <SelectField
          id={id}
          value={value || EMPTY_TOPIC_VALUE}
          onValueChange={(next) => onChange(next === EMPTY_TOPIC_VALUE ? "" : next)}
          disabled={disabled || mgr.isLoading}
          invalid={invalid}
          searchable
          placeholder={t("topicPlaceholder")}
          options={options}
        />
      </div>

      <AppTooltip content={tm("shortcutTooltip")}>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 gap-1.5"
          disabled={disabled}
          onClick={mgr.openDialog}
        >
          <FolderCog className="size-4" />
          <span>{tm("manageButton")}</span>
        </Button>
      </AppTooltip>

      <Dialog
        open={mgr.dialogOpen}
        onOpenChange={(open) => (open ? mgr.openDialog() : mgr.closeDialog())}
      >
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{tm("dialogTitle")}</DialogTitle>
            <DialogDescription>{tm("dialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {mgr.canCreate || (mgr.editing && mgr.canUpdate) ? (
              <div className="bg-muted/40 space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">
                    {mgr.editing
                      ? tm("editHeading", { name: mgr.editing.name })
                      : tm("createHeading")}
                  </h4>
                  {mgr.editing ? (
                    <Button type="button" variant="ghost" size="sm" onClick={mgr.resetEditor}>
                      <X className="mr-1 size-3.5" />
                      {tm("cancelEdit")}
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1.5">
                    <Label htmlFor="reminder-topic-name">{tm("nameLabel")}</Label>
                    <Input
                      id="reminder-topic-name"
                      className="h-10"
                      value={mgr.name}
                      onChange={(e) => mgr.setName(e.target.value)}
                      placeholder={tm("namePlaceholder")}
                      maxLength={80}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void mgr.submitTopic();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reminder-topic-color">{tm("colorLabel")}</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {REMINDER_TOPIC_COLORS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          aria-label={preset}
                          onClick={() => mgr.setColor(preset)}
                          className="border-border flex size-8 items-center justify-center rounded-full border transition-transform hover:scale-105"
                          style={{ backgroundColor: preset }}
                        >
                          {mgr.color.toUpperCase() === preset ? (
                            <Check className="size-4 text-white" />
                          ) : null}
                        </button>
                      ))}
                      <Input
                        id="reminder-topic-color"
                        type="color"
                        value={mgr.color}
                        onChange={(e) => mgr.setColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer p-1"
                      />
                    </div>
                  </div>
                </div>

                {mgr.formError ? <p className="text-destructive text-sm">{mgr.formError}</p> : null}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    className="h-10"
                    disabled={mgr.isSaving}
                    onClick={() => void mgr.submitTopic()}
                  >
                    <Plus className="mr-1.5 size-4" />
                    {mgr.editing ? tm("saveButton") : tm("addButton")}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {tm("listHeading", { count: mgr.topics.length })}
              </h4>
              <div className="divide-y rounded-xl border">
                {mgr.topics.map((topic) => {
                  const isSelected = topic.id === value;
                  return (
                    <div
                      key={topic.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="size-3.5 shrink-0 rounded-full"
                          style={{ backgroundColor: topic.color }}
                        />
                        <span className="truncate font-medium">{topic.name}</span>
                        {topic.isSystem ? (
                          <Badge variant="secondary">{tm("systemBadge")}</Badge>
                        ) : null}
                        {isSelected ? <Badge variant="default">{tm("selectedBadge")}</Badge> : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            onChange(topic.id);
                            mgr.closeDialog();
                          }}
                        >
                          {isSelected ? tm("selectedButton") : tm("selectButton")}
                        </Button>

                        {topic.isSystem ? (
                          <AppTooltip content={tm("systemLockedTooltip")}>
                            <span className="text-muted-foreground inline-flex size-8 items-center justify-center rounded-md border">
                              <Lock className="size-3.5" />
                            </span>
                          </AppTooltip>
                        ) : (
                          <>
                            {mgr.canUpdate ? (
                              <AppTooltip content={tm("editTooltip")}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => mgr.startEdit(topic)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </AppTooltip>
                            ) : null}
                            {mgr.canDelete ? (
                              <AppTooltip content={tm("deleteTooltip")}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={mgr.isDeleting}
                                  onClick={() => void mgr.removeTopic(topic)}
                                >
                                  <Trash2 className="text-destructive size-4" />
                                </Button>
                              </AppTooltip>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
            <Button type="button" variant="outline" className="h-10" onClick={mgr.closeDialog}>
              {tm("closeButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
