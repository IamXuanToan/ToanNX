"use client";

import { HeartHandshake, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { FormField } from "@/shares/components/common/form-field";
import { SelectField } from "@/shares/components/common/select-field";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Textarea } from "@/shares/components/ui/textarea";

import type { PageFeedbackDetail } from "../../types/page-feedback.types";
import { FeedbackThankDialog } from "./feedback-thank-dialog";
import { usePageFeedbackDetailForm } from "./hooks/use-page-feedback-detail";

/**
 * Chi tiết góp ý / báo lỗi ẩn danh: thông tin đối tượng, nội dung khách gửi,
 * biểu mẫu cập nhật trạng thái + ghi chú xử lý và nút gửi email cảm ơn.
 *
 * @param props - Dữ liệu chi tiết góp ý, quyền gửi cảm ơn và callback sau khi cập nhật.
 * @returns Khối chi tiết và form xử lý góp ý.
 */
export function PageFeedbackDetailForm({
  feedback,
  canEdit,
  canThank,
  onSuccess,
}: {
  feedback: PageFeedbackDetail;
  canEdit: boolean;
  canThank: boolean;
  onSuccess?: () => void;
}) {
  const t = useTranslations("utilities.feedbacks");
  const readOnly = !canEdit;
  const state = usePageFeedbackDetailForm({ feedback, onSuccess });
  const { form } = state;

  const canSendThank = canThank && Boolean(feedback.senderEmail);
  const thankTooltip = !feedback.senderEmail
    ? t("thankDisabledNoEmail")
    : !canThank
      ? t("thankDisabledNoPermission")
      : t("actions.thank");

  return (
    <>
      <div className="space-y-6">
        <div className="bg-muted/30 grid gap-4 rounded-xl border p-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.targetTitle")}</p>
            <p className="mt-1 font-medium">{feedback.targetTitle || "—"}</p>
            <p className="text-muted-foreground mt-0.5 text-xs break-all">{feedback.targetUrl}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.feedbackType")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t(`types.${feedback.feedbackType}`)}</Badge>
              <Badge variant="secondary">{t(`targetTypes.${feedback.targetType}`)}</Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.sender")}</p>
            <p className="mt-1 text-sm font-medium">
              {feedback.senderName || t("anonymousSender")}
            </p>
            <p className="text-muted-foreground text-xs">{feedback.senderEmail || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.thankedAt")}</p>
            <div className="mt-1 text-sm">
              {feedback.thankedAt ? (
                <TimestampText value={feedback.thankedAt} />
              ) : (
                <span className="text-muted-foreground">{t("notThanked")}</span>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground text-xs">{t("fields.message")}</p>
            <p className="bg-background mt-1 rounded-lg border p-3 text-sm whitespace-pre-wrap">
              {feedback.message}
            </p>
          </div>
        </div>

        <form onSubmit={state.submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="status" label={t("fields.status")} required>
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                  options={[
                    { value: "OPEN", label: t("statuses.OPEN") },
                    { value: "IN_PROGRESS", label: t("statuses.IN_PROGRESS") },
                    { value: "RESOLVED", label: t("statuses.RESOLVED") },
                    { value: "IGNORED", label: t("statuses.IGNORED") },
                  ]}
                />
              )}
            </FormField>
          </div>

          <FormField
            control={form.control}
            name="resolutionNote"
            label={t("fields.resolutionNote")}
          >
            {(field) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                disabled={readOnly}
                rows={4}
                placeholder={t("placeholders.resolutionNote")}
              />
            )}
          </FormField>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <AppTooltip content={thankTooltip}>
              <span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSendThank}
                  onClick={() => state.setThankOpen(true)}
                >
                  <HeartHandshake className="mr-2 size-4" />
                  {feedback.thankedAt ? t("actions.thankAgain") : t("actions.thank")}
                </Button>
              </span>
            </AppTooltip>

            {!readOnly ? (
              <Button type="submit" disabled={state.isPending}>
                <Save className="mr-2 size-4" />
                {t("actions.saveResolution")}
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <FeedbackThankDialog
        feedback={feedback}
        open={state.thankOpen}
        onOpenChange={state.setThankOpen}
      />
    </>
  );
}
