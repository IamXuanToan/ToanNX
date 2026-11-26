"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { ColorInput } from "@/shares/components/common/color-input";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { SelectField } from "@/shares/components/common/select-field";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { PLATFORM_COLOR_PRESETS } from "../../constants/chart-colors";
import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import type { Platform } from "../../types/platform.types";
import { usePlatformForm } from "./hooks/use-platform-form";
import { PlatformRulesDialog } from "./platform-rules-dialog";

/**
 * Form nền tảng (một form cho tạo, sửa, xem) kèm nút `+` (`Alt+R`) mở dialog Quy tắc phân loại.
 *
 * @param props - Nền tảng (khi sửa), khóa sửa & cờ quyền quản lý quy tắc phân loại.
 * @returns Form và Dialog quy tắc phân loại.
 */
export function PlatformForm({
  platform,
  disabled = false,
  canReadRules = false,
  canCreateRule = false,
  canUpdateRule = false,
  canDeleteRule = false,
}: {
  platform?: Platform;
  disabled?: boolean;
  canReadRules?: boolean;
  canCreateRule?: boolean;
  canUpdateRule?: boolean;
  canDeleteRule?: boolean;
}) {
  const t = useTranslations("finance.platforms");
  const tCommon = useTranslations("common.actions");
  const routes = useFinanceRoutes();
  const {
    form,
    onSubmit,
    isSubmitting,
    currencyOptions,
    platformName,
    rulesDialogOpen,
    setRulesDialogOpen,
    draftRules,
    setDraftRules,
    rulesCount,
  } = usePlatformForm(platform, canReadRules);
  const locked = disabled || isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <Form onSubmit={onSubmit} className="space-y-6">
        {rootError ? (
          <p role="alert" className="text-destructive text-sm">
            {rootError}
          </p>
        ) : null}
        <FormLayout>
          <FormSection title={t("sections.info")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="name" label={t("fields.name")} required>
                {(field) => (
                  <Input {...field} maxLength={150} disabled={locked} autoFocus={!platform} />
                )}
              </FormField>
              <FormField control={form.control} name="code" label={t("fields.code")} required>
                {(field) => <SlugInput {...field} disabled={locked} />}
              </FormField>
              <FormField
                control={form.control}
                name="defaultCurrencyId"
                label={t("fields.defaultCurrency")}
                description={t("fields.defaultCurrencyHint")}
                required
              >
                {(field) => (
                  <SelectField
                    options={currencyOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={locked}
                    invalid={field["aria-invalid"]}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="color"
                label={t("fields.color")}
                description={t("fields.colorHint")}
              >
                {(field) => (
                  <div className="space-y-2">
                    <ColorInput
                      value={field.value}
                      onChange={field.onChange}
                      pickerLabel={t("fields.color")}
                      disabled={locked}
                      invalid={Boolean(field["aria-invalid"])}
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PLATFORM_COLOR_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          disabled={locked}
                          aria-label={t("fields.colorPreset", { color: preset })}
                          title={preset}
                          onClick={() => field.onChange(preset)}
                          className="size-6 rounded-full p-0"
                          style={{ backgroundColor: preset }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </FormField>
            </div>
            <FormField control={form.control} name="note" label={t("fields.note")}>
              {(field) => <Textarea {...field} rows={3} disabled={locked} />}
            </FormField>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <ChoiceList
                  control="switch"
                  items={[{ value: "isActive", label: t("fields.isActive") }]}
                  value={field.value ? ["isActive"] : []}
                  onToggle={(_, checked) => field.onChange(checked)}
                  disabled={locked}
                  aria-label={t("fields.isActive")}
                />
              )}
            />
          </FormSection>

          {canReadRules ? (
            <FormSection title={t("sections.rulesShortcut")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{t("rulesShortcutTitle")}</p>
                    <Badge variant="secondary" className="tabular-nums">
                      {platform
                        ? t("rulesCountBadge", { count: rulesCount })
                        : t("draftRulesCount", { count: rulesCount })}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{t("rulesShortcutHint")}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRulesDialogOpen(true)}
                  data-testid="platform-rules-shortcut-btn"
                  title="Alt+R"
                >
                  <Plus />
                  <span>{t("manageRules")}</span>
                  <kbd className="border-border bg-muted text-muted-foreground ml-1 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
                    Alt+R
                  </kbd>
                </Button>
              </div>
            </FormSection>
          ) : null}
        </FormLayout>
        <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
          <Button type="button" variant="outline" asChild>
            <Link href={routes.platforms}>{disabled ? tCommon("back") : tCommon("cancel")}</Link>
          </Button>
          {disabled ? null : (
            <FormSubmitButton
              isSubmitting={isSubmitting}
              disabled={Boolean(platform) && !form.formState.isDirty}
            >
              {platform ? tCommon("save") : tCommon("create")}
            </FormSubmitButton>
          )}
        </FormActions>
      </Form>

      {canReadRules ? (
        <PlatformRulesDialog
          open={rulesDialogOpen}
          onOpenChange={setRulesDialogOpen}
          platformId={platform?.id}
          platformName={platformName}
          draftRules={draftRules}
          onDraftRulesChange={setDraftRules}
          canCreate={canCreateRule}
          canUpdate={canUpdateRule}
          canDelete={canDeleteRule}
        />
      ) : null}
    </>
  );
}
