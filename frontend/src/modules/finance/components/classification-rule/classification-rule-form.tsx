"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { FINANCE_ROUTES } from "../../constants/routes";
import type { ClassificationRule } from "../../types/classification-rule.types";
import { useClassificationRuleForm } from "./hooks/use-classification-rule-form";
import { RuleTester } from "./rule-tester";

/**
 * Form quy tắc nhận diện: tên, nền tảng, regex (so trên nội dung đã bỏ dấu, viết hoa), ưu tiên; kèm ô thử.
 *
 * @param props - Quy tắc (khi sửa), khóa sửa.
 * @returns Form.
 */
export function ClassificationRuleForm({
  rule,
  disabled = false,
}: {
  rule?: ClassificationRule;
  disabled?: boolean;
}) {
  const t = useTranslations("finance.rules");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting, platformOptions } = useClassificationRuleForm(rule);
  const pattern = useWatch({ control: form.control, name: "pattern" });
  const locked = disabled || isSubmitting;
  const rootError = form.formState.errors.root?.message;
  return (
    <Form onSubmit={onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}
      <FormLayout
        aside={
          <FormSection title={t("tester.title")}>
            <RuleTester pattern={pattern} />
          </FormSection>
        }
      >
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => <Input {...field} maxLength={150} disabled={locked} autoFocus={!rule} />}
            </FormField>
            <FormField
              control={form.control}
              name="platformId"
              label={t("fields.platform")}
              required
            >
              {(field) => (
                <SelectField
                  options={platformOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
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
              <Input {...field} className="font-mono" maxLength={500} disabled={locked} />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="priority"
            label={t("fields.priority")}
            description={t("fields.priorityHint")}
            required
          >
            {(field) => (
              <NumberInput
                {...field}
                integer
                onChange={(value) => field.onChange(String(value))}
                disabled={locked}
              />
            )}
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
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={FINANCE_ROUTES.rules}>{disabled ? tCommon("back") : tCommon("cancel")}</Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={isSubmitting}
            disabled={Boolean(rule) && !form.formState.isDirty}
          >
            {rule ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
