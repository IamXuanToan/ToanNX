"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list/choice-list";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { NumberInput } from "@/shares/components/common/number-input/number-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { CUSTOM_PAGES_ROUTES } from "../../constants/routes";
import type { PagePath } from "../../types/page-path.types";
import { usePagePathForm } from "./hooks/use-page-path-form";

/**
 * Form đường dẫn giữa — **một form** cho trang riêng (`FormPage`) và dialog tạo/sửa nhanh (`FormDialog`).
 *
 * @param props - Đường dẫn (khi sửa), khoá sửa, callback sau lưu và hủy (dialog).
 * @returns Form.
 */
export function PagePathForm({
  path,
  disabled = false,
  onSaved,
  onCancel,
}: {
  path?: PagePath;
  disabled?: boolean;
  onSaved?: (path: PagePath) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("customPages.paths");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("common.status");
  const { form, onSubmit, isSubmitting } = usePagePathForm({ path, onSaved });
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
          <FormSection title={t("sections.status")}>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <ChoiceList
                  control="switch"
                  items={[
                    {
                      value: "isActive",
                      label: tStatus("active"),
                      description: t("fields.isActiveHint"),
                    },
                  ]}
                  value={field.value ? ["isActive"] : []}
                  onToggle={(_, checked) => field.onChange(checked)}
                  disabled={locked}
                  aria-label={t("sections.status")}
                />
              )}
            />
            <FormField control={form.control} name="position" label={t("fields.position")}>
              {(field) => (
                <NumberInput
                  {...field}
                  value={field.value}
                  onChange={(value) => field.onChange(value === "" ? 0 : value)}
                  min={0}
                  integer
                  disabled={locked}
                />
              )}
            </FormField>
          </FormSection>
        }
      >
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="segment"
              label={t("fields.segment")}
              description={path ? t("fields.segmentChangeHint") : t("fields.segmentHint")}
              required
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={32}
                  placeholder="qr"
                  disabled={locked}
                  autoFocus={!path}
                />
              )}
            </FormField>
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => <Input {...field} maxLength={100} disabled={locked} />}
            </FormField>
          </div>
          <FormField control={form.control} name="description" label={t("fields.description")}>
            {(field) => <Textarea {...field} rows={2} maxLength={300} disabled={locked} />}
          </FormField>
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href={CUSTOM_PAGES_ROUTES.paths}>
              {disabled ? tCommon("back") : tCommon("cancel")}
            </Link>
          </Button>
        )}
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={isSubmitting}
            disabled={Boolean(path) && !form.formState.isDirty}
          >
            {path ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
