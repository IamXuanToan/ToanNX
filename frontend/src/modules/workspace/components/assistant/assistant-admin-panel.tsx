"use client";

import { ExternalLink, Images, Info, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { AttachmentPicker } from "@/modules/system/components/attachment/attachment-picker";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormPage } from "@/shares/components/common/form-page";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import {
  ASSISTANT_LAUNCHER_SIZE_OPTIONS,
  ASSISTANT_POLICY_PRESETS,
  TELEGRAM_GROUP_TOOL_POLICIES,
} from "../../constants/defaults";
import { AssistantAvatar } from "./assistant-avatar";
import { AssistantTelegramCommandsCard } from "./assistant-telegram-commands-card";
import { useAssistantAdminPanel } from "./hooks/use-assistant-admin-panel";

const AUTO_MODEL_VALUE = "__AUTO__";

/**
 * Trang quản trị Chatbot AI dùng chung toàn hệ thống trên Admin (`/quan-tri/he-thong/tro-ly-ai`),
 * chuẩn hóa đồng bộ `FormPage` + `FormLayout` + `FormSection` + `FormActions` như các danh mục Hệ thống.
 *
 * @param props - Các cờ quyền IAM từ View.
 * @returns Giao diện quản trị Chatbot AI chuẩn Admin.
 */
export function AssistantAdminPanel({
  canReadConfig,
  canUpdateConfig,
  canReadAttachments,
  canUploadAttachments,
}: {
  canReadConfig: boolean;
  canUpdateConfig: boolean;
  canReadAttachments: boolean;
  canUploadAttachments: boolean;
}) {
  const t = useTranslations("workspace.assistantAdmin");
  const tAssistant = useTranslations("workspace.assistant");
  const tCommon = useTranslations("common.actions");
  const state = useAssistantAdminPanel(canReadConfig);
  const { configQuery, form } = state;

  if (configQuery.isPending) {
    return <Skeleton className="mx-auto h-72 w-full max-w-6xl rounded-xl" />;
  }

  if (configQuery.isError) {
    return <QueryErrorState error={configQuery.error} onRetry={() => configQuery.refetch()} />;
  }

  const config = configQuery.data;
  const locked = !canUpdateConfig || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const safeBotUrl = toSafeHttpUrl(config.telegramBotUrl, { allowRelative: false });
  const availableModels = config.availableAiModels ?? [];

  return (
    <FormPage title={t("title")}>
      <Form onSubmit={state.onSubmit} className="space-y-6">
        {rootError ? (
          <p role="alert" className="text-destructive text-sm">
            {rootError}
          </p>
        ) : null}

        <FormLayout
          aside={<AssistantTelegramCommandsCard commands={config.telegramCommands ?? []} />}
        >
          <FormSection title={t("sections.identity")}>
            <div className="grid items-start gap-5 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-start gap-2">
                <AssistantAvatar
                  avatarUrl={state.assistantAvatarUrl}
                  name={state.assistantName || tAssistant("defaultName")}
                  size="lg"
                  className="size-16"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {canReadAttachments ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={locked}
                      onClick={() => state.setLibraryOpen(true)}
                    >
                      <Images />
                      {t("selectAvatar")}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">{t("avatarMissingPerm")}</span>
                  )}
                  {state.assistantAvatarUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={locked}
                      onClick={state.removeAvatar}
                    >
                      <Trash2 />
                      {t("removeAvatar")}
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground max-w-xs text-xs">{t("avatarHint")}</p>
              </div>

              <FormField
                control={form.control}
                name="assistantName"
                label={t("fields.assistantName")}
              >
                {(field) => (
                  <Input
                    {...field}
                    placeholder={t("fields.assistantNamePlaceholder")}
                    disabled={locked}
                    maxLength={80}
                    className="h-10"
                  />
                )}
              </FormField>
            </div>

            <Controller
              control={form.control}
              name="launcherSize"
              render={({ field }) => (
                <RadioGroupField
                  name="launcherSize"
                  legend={t("fields.launcherSize")}
                  description={t("launcherSizeHint")}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  groupClassName="grid gap-2.5 sm:grid-cols-3"
                  options={ASSISTANT_LAUNCHER_SIZE_OPTIONS.map((size) => ({
                    value: size,
                    label: t(`launcherSizes.${size}.label`),
                    description: t(`launcherSizes.${size}.description`),
                  }))}
                />
              )}
            />
          </FormSection>

          <FormSection title={t("sections.policy")}>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">{t("presetsLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {ASSISTANT_POLICY_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={locked}
                    onClick={() => state.applyPreset(t(`presets.${preset}.value`))}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Sparkles className="size-3.5" />
                    {t(`presets.${preset}.label`)}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="assistantSystemPrompt"
              label={t("fields.assistantSystemPrompt")}
            >
              {(field) => (
                <Textarea
                  {...field}
                  rows={6}
                  placeholder={t("fields.assistantSystemPromptPlaceholder")}
                  disabled={locked}
                  maxLength={2000}
                />
              )}
            </FormField>

            <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border p-3 text-xs">
              <Info className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{t("policySecurityNote")}</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="preferredAiModel"
                label={t("fields.preferredAiModel")}
              >
                {(field) => (
                  <SelectField
                    id={field.id}
                    value={field.value || AUTO_MODEL_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === AUTO_MODEL_VALUE ? "" : value)
                    }
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
                    min={100}
                    onChange={(value) => field.onChange(value === "" ? "" : String(value))}
                    disabled={locked}
                    className="h-10"
                  />
                )}
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t("sections.telegram")}>
            <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
              <span>
                {config.telegramBotConfigured
                  ? t("telegramBotLinked", { username: config.telegramBotUsername })
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

            <Controller
              control={form.control}
              name="telegramAiEnabled"
              render={({ field }) => (
                <ChoiceList
                  control="switch"
                  items={[{ value: "enabled", label: t("fields.telegramAiEnabled") }]}
                  value={field.value ? ["enabled"] : []}
                  onToggle={(_, checked) => field.onChange(checked)}
                  disabled={locked}
                  aria-label={t("fields.telegramAiEnabled")}
                />
              )}
            />

            <FormField
              control={form.control}
              name="telegramGroupToolPolicy"
              label={t("fields.telegramGroupToolPolicy")}
            >
              {(field) => (
                <SelectField
                  id={field.id}
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

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="telegramGroupRequireMention"
                  render={({ field }) => (
                    <Checkbox
                      id="admin-tg-mention"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      disabled={locked}
                    />
                  )}
                />
                <Label htmlFor="admin-tg-mention">{t("fields.telegramGroupRequireMention")}</Label>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="telegramGroupHideAmounts"
                  render={({ field }) => (
                    <Checkbox
                      id="admin-tg-hide-amounts"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      disabled={locked}
                    />
                  )}
                />
                <Label htmlFor="admin-tg-hide-amounts">
                  {t("fields.telegramGroupHideAmounts")}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="telegramGroupReplyInDm"
                  render={({ field }) => (
                    <Checkbox
                      id="admin-tg-reply-dm"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      disabled={locked}
                    />
                  )}
                />
                <Label htmlFor="admin-tg-reply-dm">{t("fields.telegramGroupReplyInDm")}</Label>
              </div>
            </div>
          </FormSection>
        </FormLayout>

        <FormActions>
          <Button asChild type="button" variant="outline">
            <Link href={SYSTEM_ROUTES.settings}>{tCommon("back")}</Link>
          </Button>
          {canUpdateConfig ? (
            <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
          ) : null}
        </FormActions>
      </Form>

      {state.libraryOpen && canReadAttachments ? (
        <AttachmentPicker
          canUpload={canUploadAttachments}
          lockVisibility
          onSelect={state.selectAvatar}
          onClose={() => state.setLibraryOpen(false)}
        />
      ) : null}
    </FormPage>
  );
}
