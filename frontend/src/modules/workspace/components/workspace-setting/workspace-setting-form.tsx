"use client";

import { ExternalLink, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { TELEGRAM_GROUP_TOOL_POLICIES, WORKSPACE_TIMEZONE_OPTIONS } from "../../constants/defaults";
import { useWorkspaceSettingForm } from "./hooks/use-workspace-setting-form";

const AUTO_MODEL_VALUE = "__AUTO__";

/**
 * Form Cài đặt Workspace: Múi giờ, Digest theo khung giờ, AI model & chính sách nhóm Telegram.
 *
 * @param props - Cờ cho phép lưu thay đổi (`workspace.workspace_setting.update`).
 * @returns Form Cài đặt Workspace.
 */
export function WorkspaceSettingForm({ canUpdate }: { canUpdate: boolean }) {
  const t = useTranslations("workspace.settings");
  const state = useWorkspaceSettingForm();
  const { settingQuery, form } = state;

  if (settingQuery.isPending) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (settingQuery.isError) {
    return <QueryErrorState error={settingQuery.error} onRetry={() => settingQuery.refetch()} />;
  }

  const setting = settingQuery.data;
  const locked = !canUpdate || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const safeBotUrl = toSafeHttpUrl(setting.telegramBotUrl, { allowRelative: false });
  const availableSections = setting.availableDigestSections ?? [];
  const availableModels = setting.availableAiModels ?? [];

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormSection title={t("sections.digest")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="timezone" label={t("fields.timezone")}>
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                options={WORKSPACE_TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz }))}
              />
            )}
          </FormField>

          <div className="flex items-center gap-2 pt-6">
            <Controller
              control={form.control}
              name="dailyDigestEnabled"
              render={({ field }) => (
                <Checkbox
                  id="ws-daily-digest"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={locked}
                />
              )}
            />
            <Label htmlFor="ws-daily-digest">{t("fields.dailyDigestEnabled")}</Label>
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="digestTimeSlots"
              label={t("fields.digestTimeSlots")}
            >
              {() => (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {state.digestTimeSlots.map((slot) => (
                      <Badge key={slot} variant="secondary" className="gap-1.5 px-2.5 py-1">
                        <span className="tabular-nums">{slot}</span>
                        {!locked ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-4 p-0"
                            onClick={() => state.removeSlot(slot)}
                            aria-label={slot}
                          >
                            <X className="size-3" />
                          </Button>
                        ) : null}
                      </Badge>
                    ))}
                  </div>
                  {!locked ? (
                    <div className="flex gap-2">
                      <Input
                        value={state.slotInput}
                        onChange={(e) => state.setSlotInput(e.target.value)}
                        placeholder={t("addSlotPlaceholder")}
                        className="h-10 max-w-36"
                      />
                      <Button type="button" variant="outline" onClick={state.addSlot}>
                        <Plus />
                        {t("addSlot")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="digestSections"
              label={t("fields.digestSections")}
            >
              {() => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableSections.map((sec) => (
                    <div key={sec} className="flex items-center gap-2">
                      <Checkbox
                        id={`digest-sec-${sec}`}
                        checked={state.digestSections.includes(sec)}
                        onCheckedChange={(checked) => state.toggleSection(sec, Boolean(checked))}
                        disabled={locked}
                      />
                      <Label htmlFor={`digest-sec-${sec}`}>
                        {t(`digestSectionLabels.${sec}` as never)}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </FormField>
          </div>

          <FormField
            control={form.control}
            name="warrantyAlertDaysText"
            label={t("fields.warrantyAlertDays")}
          >
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <FormField
            control={form.control}
            name="subscriptionDefaultAlertDaysText"
            label={t("fields.subscriptionDefaultAlertDays")}
          >
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t("sections.ai")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="preferredAiModel"
            label={t("fields.preferredAiModel")}
          >
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value || AUTO_MODEL_VALUE}
                onValueChange={(v) => field.onChange(v === AUTO_MODEL_VALUE ? "" : v)}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={[
                  { value: AUTO_MODEL_VALUE, label: t("modelAutoDefault") },
                  ...availableModels.map((model) => ({ value: model, label: model })),
                ]}
              />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="aiDailyTokenLimit"
            label={t("fields.aiDailyTokenLimit")}
          >
            {(field) => (
              <NumberInput
                {...field}
                integer
                onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                disabled={locked}
                className="h-10"
              />
            )}
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t("sections.telegram")}>
        <div className="space-y-4">
          <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
            <span>
              {setting.telegramBotConfigured
                ? t("telegramBotLinked", { username: setting.telegramBotUsername })
                : t("telegramBotMissing")}
            </span>
            {safeBotUrl ? (
              <Button asChild variant="outline" size="sm">
                <Link href={safeBotUrl as never} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  {t("openTelegramBot")}
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="telegramAiEnabled"
              render={({ field }) => (
                <Checkbox
                  id="ws-tg-enabled"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={locked}
                />
              )}
            />
            <Label htmlFor="ws-tg-enabled">{t("fields.telegramAiEnabled")}</Label>
          </div>

          <FormField
            control={form.control}
            name="telegramAllowedChatIds"
            label={t("fields.telegramAllowedChatIds")}
          >
            {() =>
              state.telegramChats.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noTelegramChats")}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {state.telegramChats.map((chat) => (
                    <div key={chat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`tg-chat-${chat.id}`}
                        checked={state.telegramAllowedChatIds.includes(chat.id)}
                        onCheckedChange={(checked) => state.toggleChatId(chat.id, Boolean(checked))}
                        disabled={locked}
                      />
                      <Label htmlFor={`tg-chat-${chat.id}`}>
                        {chat.title} ({chat.chatType})
                      </Label>
                    </div>
                  ))}
                </div>
              )
            }
          </FormField>

          <FormField
            control={form.control}
            name="telegramGroupToolPolicy"
            label={t("fields.telegramGroupToolPolicy")}
          >
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                options={TELEGRAM_GROUP_TOOL_POLICIES.map((policy) => ({
                  value: policy,
                  label: t(`groupPolicies.${policy}`),
                }))}
              />
            )}
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="telegramGroupRequireMention"
                render={({ field }) => (
                  <Checkbox
                    id="ws-tg-mention"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={locked}
                  />
                )}
              />
              <Label htmlFor="ws-tg-mention">{t("fields.telegramGroupRequireMention")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="telegramGroupHideAmounts"
                render={({ field }) => (
                  <Checkbox
                    id="ws-tg-hide-amounts"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={locked}
                  />
                )}
              />
              <Label htmlFor="ws-tg-hide-amounts">{t("fields.telegramGroupHideAmounts")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="telegramGroupReplyInDm"
                render={({ field }) => (
                  <Checkbox
                    id="ws-tg-reply-dm"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={locked}
                  />
                )}
              />
              <Label htmlFor="ws-tg-reply-dm">{t("fields.telegramGroupReplyInDm")}</Label>
            </div>
          </div>
        </div>
      </FormSection>

      {canUpdate ? (
        <FormActions>
          <FormSubmitButton isSubmitting={state.isSubmitting}>{t("save")}</FormSubmitButton>
        </FormActions>
      ) : null}
    </Form>
  );
}
