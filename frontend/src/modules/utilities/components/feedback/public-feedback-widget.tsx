"use client";

import { cn } from "cn";
import { CheckCircle2, MessageSquareWarning, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { FormField } from "@/shares/components/common/form-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import type { PageFeedbackTargetType } from "../../types/page-feedback.types";
import { usePublicFeedbackWidget } from "./hooks/use-public-feedback-widget";

/**
 * Nút nổi tròn kéo-thả kiểu avatar chatbot dành riêng cho trang công khai (Custom Page & ShortLink).
 * Khi bấm mở popup form góp ý / báo lỗi ẩn danh và thông báo tới hồ sơ chủ trang.
 *
 * @param props - Thông tin đối tượng (`PAGE` hoặc `SHORT_LINK`) để định tuyến đúng chủ sở hữu.
 * @returns Nút tròn kéo-thả và popup góp ý.
 */
export function PublicFeedbackWidget({
  targetType,
  targetId,
  slug,
  targetTitle,
}: {
  targetType: PageFeedbackTargetType;
  targetId?: string;
  slug?: string;
  targetTitle?: string;
}) {
  const t = useTranslations("utilities.publicFeedback");
  const state = usePublicFeedbackWidget({ targetType, targetId, slug, targetTitle });
  const { form } = state;

  return (
    <>
      {state.open ? (
        <section
          role="dialog"
          aria-label={t("title")}
          style={state.popupStyle}
          className="bg-background border-border fixed z-40 flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
        >
          <div className="bg-primary text-primary-foreground flex shrink-0 items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-foreground/15 flex size-8 items-center justify-center rounded-full">
                <MessageSquareWarning className="size-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm leading-tight font-semibold">{t("title")}</p>
                <p className="text-primary-foreground/80 text-xs">{t("subtitle")}</p>
              </div>
            </div>
            <AppTooltip content={t("close")}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("close")}
                onClick={() => state.setOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/15 size-8"
              >
                <X className="size-4" />
              </Button>
            </AppTooltip>
          </div>

          <div className="overflow-y-auto p-4">
            {state.submitted ? (
              <div className="space-y-3 py-4 text-center">
                <CheckCircle2 className="text-success mx-auto size-10" />
                <p className="text-sm font-semibold">{t("thankTitle")}</p>
                <p className="text-muted-foreground text-xs">{t("thankDesc")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => state.setSubmitted(false)}
                >
                  {t("sendAnother")}
                </Button>
              </div>
            ) : (
              <form onSubmit={state.submit} className="space-y-3">
                {/* Trường bẫy bot honeypot ẩn khỏi người dùng thật */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  {...form.register("website")}
                />

                <FormField
                  control={form.control}
                  name="feedbackType"
                  label={t("typeLabel")}
                  required
                >
                  {(field) => (
                    <SelectField
                      id={field.id}
                      value={field.value}
                      onValueChange={field.onChange}
                      searchable
                      options={[
                        { value: "BROKEN_LINK", label: t("types.BROKEN_LINK") },
                        { value: "WRONG_INFO", label: t("types.WRONG_INFO") },
                        { value: "BUG", label: t("types.BUG") },
                        { value: "SUGGESTION", label: t("types.SUGGESTION") },
                        { value: "OTHER", label: t("types.OTHER") },
                      ]}
                    />
                  )}
                </FormField>

                <FormField control={form.control} name="message" label={t("messageLabel")} required>
                  {(field) => (
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t("messagePlaceholder")}
                      className="resize-none"
                    />
                  )}
                </FormField>

                <FormField control={form.control} name="senderName" label={t("nameLabel")}>
                  {(field) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("namePlaceholder")}
                    />
                  )}
                </FormField>

                <FormField control={form.control} name="senderEmail" label={t("emailLabel")}>
                  {(field) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      placeholder={t("emailPlaceholder")}
                    />
                  )}
                </FormField>

                <Button type="submit" className="w-full" disabled={state.isPending}>
                  <Send className="mr-2 size-4" />
                  {t("submit")}
                </Button>
              </form>
            )}
          </div>
        </section>
      ) : null}

      <AppTooltip content={state.isDragging ? undefined : t("tooltip")}>
        <Button
          type="button"
          size="icon"
          aria-label={t("title")}
          style={state.buttonStyle}
          onPointerDown={state.onPointerDown}
          onPointerMove={state.onPointerMove}
          onPointerUp={state.onPointerUp}
          onPointerCancel={state.onPointerCancel}
          className={cn(
            "fixed z-40 cursor-grab touch-none rounded-full shadow-lg select-none active:cursor-grabbing",
            !state.isDragging && "transition-[left,top,transform] duration-200 hover:scale-105",
          )}
        >
          {state.open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <MessageSquareWarning className="size-5" aria-hidden="true" />
          )}
        </Button>
      </AppTooltip>
    </>
  );
}
