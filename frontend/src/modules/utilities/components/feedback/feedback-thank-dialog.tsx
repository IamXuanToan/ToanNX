"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { SelectField } from "@/shares/components/common/select-field";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Field, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import type { PageFeedback, PageFeedbackDetail } from "../../types/page-feedback.types";
import { useFeedbackThankDialog } from "./hooks/use-feedback-thank-dialog";

/**
 * Hộp thoại chọn mẫu email cảm ơn, tự nạp nội dung đã trộn biến của góp ý hiện tại
 * và cho phép chỉnh sửa trực tiếp bằng `TiptapEditor` trước khi gửi.
 *
 * @param props - Bản ghi góp ý, trạng thái mở dialog và callback đóng/mở.
 * @returns Dialog gửi email cảm ơn.
 */
export function FeedbackThankDialog({
  feedback,
  open,
  onOpenChange,
}: {
  feedback: PageFeedback | PageFeedbackDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("utilities.feedbacks.thankDialog");
  const tCommon = useTranslations("common");
  const state = useFeedbackThankDialog({ feedback, open, onOpenChange });
  const recipientEmail = feedback?.senderEmail;

  const templateOptions = [
    { value: "auto", label: t("autoTemplate") },
    ...state.templates.map((tpl) => ({
      value: tpl.id,
      label: `${tpl.name} (${tpl.scope === "PERSONAL" ? t("personalTag") : t("systemTag")} · ${tpl.locale.toUpperCase()})`,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {recipientEmail
              ? t("descriptionWithEmail", { email: recipientEmail })
              : t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <Field>
            <FieldLabel>{t("templateLabel")}</FieldLabel>
            <SelectField
              value={state.templateId}
              onValueChange={state.setTemplateId}
              disabled={state.isLoadingTemplates}
              options={templateOptions}
            />
          </Field>

          <Field>
            <FieldLabel>{t("customSubjectLabel")}</FieldLabel>
            <Input
              value={state.subject}
              onChange={(e) => state.setSubject(e.target.value)}
              disabled={state.isLoadingPreview}
              placeholder={t("customSubjectPlaceholder")}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>{t("customBodyLabel")}</FieldLabel>
              {state.isLoadingPreview ? (
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("loadingPreview")}
                </span>
              ) : null}
            </div>
            <TiptapEditor
              label={t("customBodyLabel")}
              value={state.doc}
              onChange={state.setDoc}
              disabled={state.isLoadingPreview}
              notion={false}
              contentClassName="min-h-[180px]"
            />
          </Field>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={state.send}
            disabled={state.isPending || state.isLoadingPreview || !recipientEmail}
          >
            <Send className="mr-2 size-4" />
            {t("sendAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
