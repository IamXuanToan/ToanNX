"use client";

import { Bot, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { PORTAL_ROUTES } from "@/modules/portal/constants/routes";
import { ChipListInput } from "@/shares/components/common/chip-list-input";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { SelectField } from "@/shares/components/common/select-field";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Switch } from "@/shares/components/ui/switch";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { WORKSPACE_TIMEZONE_SELECT_OPTIONS } from "../../constants/defaults";
import { useWorkspaceSettingForm } from "./hooks/use-workspace-setting-form";

/**
 * Form Cài đặt cá nhân: Múi giờ mặc định +7, Daily Digest, mốc ngày cảnh báo dạng chip
 * và nơi nhận Telegram cá nhân theo bố cục hai cột chuẩn.
 *
 * @param props - Cờ cho phép lưu thay đổi (`workspace.workspace_setting.update`).
 * @returns Form Cài đặt cá nhân.
 */
export function WorkspaceSettingForm({ canUpdate }: { canUpdate: boolean }) {
  const t = useTranslations("workspace.settings");
  const tWorkspaceCommon = useTranslations("workspace.common");
  const tActions = useTranslations("common.actions");
  const state = useWorkspaceSettingForm();
  const { settingQuery, form } = state;

  if (settingQuery.isPending) return <Skeleton className="h-80 w-full rounded-xl" />;
  if (settingQuery.isError) {
    return <QueryErrorState error={settingQuery.error} onRetry={() => settingQuery.refetch()} />;
  }

  const setting = settingQuery.data;
  const locked = !canUpdate || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const safeBotUrl = toSafeHttpUrl(setting.telegramBotUrl, { allowRelative: false });
  const availableSections = setting.availableDigestSections ?? [];

  const telegramAside = (
    <FormSection title={t("sections.telegram")}>
      <div className="space-y-4">
        <div className="bg-muted/30 space-y-3 rounded-xl border p-3.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground inline-flex items-center gap-1.5 font-medium">
              <Bot className="text-primary size-4 shrink-0" aria-hidden />
              <span>
                {setting.telegramBotConfigured
                  ? t("telegramBotLinked", { username: setting.telegramBotUsername })
                  : t("telegramBotMissing")}
              </span>
            </span>
            <StatusBadge tone={setting.telegramBotConfigured ? "success" : "neutral"}>
              {setting.telegramBotConfigured
                ? tWorkspaceCommon("active")
                : tWorkspaceCommon("inactive")}
            </StatusBadge>
          </div>
          {safeBotUrl ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={safeBotUrl as never} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                <span>{t("openTelegramBot")}</span>
              </Link>
            </Button>
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="telegramAllowedChatIds"
          label={t("fields.telegramAllowedChatIds")}
          description={t("telegramHint")}
        >
          {() =>
            state.telegramChats.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-xs">
                {t("noTelegramChats")}
              </p>
            ) : (
              <div className="space-y-2">
                {state.telegramChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="hover:bg-muted/40 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors"
                  >
                    <Checkbox
                      id={`tg-chat-${chat.id}`}
                      checked={state.telegramAllowedChatIds.includes(chat.id)}
                      onCheckedChange={(checked) => state.toggleChatId(chat.id, Boolean(checked))}
                      disabled={locked}
                    />
                    <Label htmlFor={`tg-chat-${chat.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="truncate">{chat.title}</span>
                      <span className="text-muted-foreground ml-auto text-xs">{chat.chatType}</span>
                    </Label>
                  </div>
                ))}
              </div>
            )
          }
        </FormField>
      </div>
    </FormSection>
  );

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormLayout aside={telegramAside}>
        <FormSection title={t("sections.digest")}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 [&>*]:min-w-0">
            <FormField
              control={form.control}
              name="timezone"
              label={t("fields.timezone")}
              description={t("timezoneDesc")}
            >
              {(field) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  options={WORKSPACE_TIMEZONE_SELECT_OPTIONS.map((tz) => ({
                    value: tz.value,
                    label: tz.label,
                  }))}
                />
              )}
            </FormField>

            <div className="bg-muted/20 flex items-start justify-between gap-3 rounded-xl border p-3.5">
              <div className="space-y-1">
                <Label htmlFor="ws-daily-digest" className="cursor-pointer font-medium">
                  {t("fields.dailyDigestEnabled")}
                </Label>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("dailyDigestDesc")}
                </p>
              </div>
              <Controller
                control={form.control}
                name="dailyDigestEnabled"
                render={({ field }) => (
                  <Switch
                    id="ws-daily-digest"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={locked}
                  />
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="digestTimeSlots"
            label={t("fields.digestTimeSlots")}
          >
            {() => (
              <ChipListInput
                values={state.digestTimeSlots}
                onChange={(next) =>
                  form.setValue("digestTimeSlots", next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                parseItem={state.parseTimeSlot}
                sortItems={state.sortTimeAsc}
                placeholder={t("addSlotPlaceholder")}
                addLabel={t("addSlot")}
                tooltip={t("addSlotTooltip")}
                emptyText={t("emptySlots")}
                disabled={locked}
                maxLength={5}
              />
            )}
          </FormField>

          <FormField
            control={form.control}
            name="digestSections"
            label={t("fields.digestSections")}
          >
            {() => (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {availableSections.map((sec) => (
                  <div
                    key={sec}
                    className="hover:bg-muted/40 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors"
                  >
                    <Checkbox
                      id={`digest-sec-${sec}`}
                      checked={state.digestSections.includes(sec)}
                      onCheckedChange={(checked) => state.toggleSection(sec, Boolean(checked))}
                      disabled={locked}
                    />
                    <Label htmlFor={`digest-sec-${sec}`} className="cursor-pointer">
                      {t(`digestSectionLabels.${sec}` as never)}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        </FormSection>

        <FormSection title={t("sections.alerts")}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 [&>*]:min-w-0">
            <FormField
              control={form.control}
              name="warrantyAlertDays"
              label={t("fields.warrantyAlertDays")}
            >
              {() => (
                <ChipListInput
                  values={state.warrantyAlertDays}
                  onChange={(next) =>
                    form.setValue("warrantyAlertDays", next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  parseItem={state.parseAlertDay}
                  sortItems={state.sortDaysDesc}
                  formatItem={(days) => t("alertDaysUnit", { days })}
                  placeholder={t("addAlertDayPlaceholder")}
                  addLabel={t("addAlertDay")}
                  tooltip={t("alertDaysTooltip")}
                  emptyText={t("emptyAlertDays")}
                  disabled={locked}
                  maxLength={3}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="subscriptionDefaultAlertDays"
              label={t("fields.subscriptionDefaultAlertDays")}
            >
              {() => (
                <ChipListInput
                  values={state.subscriptionDefaultAlertDays}
                  onChange={(next) =>
                    form.setValue("subscriptionDefaultAlertDays", next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  parseItem={state.parseAlertDay}
                  sortItems={state.sortDaysDesc}
                  formatItem={(days) => t("alertDaysUnit", { days })}
                  placeholder={t("addAlertDayPlaceholder")}
                  addLabel={t("addAlertDay")}
                  tooltip={t("alertDaysTooltip")}
                  emptyText={t("emptyAlertDays")}
                  disabled={locked}
                  maxLength={3}
                />
              )}
            </FormField>
          </div>
        </FormSection>
      </FormLayout>

      <FormActions>
        <Button asChild type="button" variant="outline">
          <Link href={PORTAL_ROUTES.dashboard}>
            {canUpdate ? tActions("cancel") : tActions("back")}
          </Link>
        </Button>
        {canUpdate ? (
          <FormSubmitButton isSubmitting={state.isSubmitting}>{t("save")}</FormSubmitButton>
        ) : null}
      </FormActions>
    </Form>
  );
}
