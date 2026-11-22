"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { DateTimePicker } from "@/shares/components/common/date-time-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useAnnouncementForm } from "./hooks/use-announcement-form";

/** @returns Form gửi thông báo hệ thống (tab Hệ thống của chuông). */
export function AnnouncementForm() {
  const t = useTranslations("system.notifications.announcements");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting, roleOptions } = useAnnouncementForm();
  const target = useWatch({ control: form.control, name: "target" });
  return (
    <Form onSubmit={onSubmit} className="space-y-6">
      <FormLayout
        aside={
          <FormSection title={t("sections.target")}>
            <Controller
              control={form.control}
              name="target"
              render={({ field }) => (
                <RadioGroupField
                  legend={t("fields.target")}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "ALL", label: t("target.ALL") },
                    { value: "ROLES", label: t("target.ROLES") },
                  ]}
                />
              )}
            />
            {target === "ROLES" ? (
              <Controller
                control={form.control}
                name="roleIds"
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <ChoiceList
                      control="checkbox"
                      items={roleOptions}
                      value={field.value}
                      onToggle={(value, checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, value]
                            : field.value.filter((id) => id !== value),
                        )
                      }
                      aria-label={t("fields.roles")}
                    />
                    {fieldState.error ? (
                      <p className="text-destructive text-sm">{fieldState.error.message}</p>
                    ) : null}
                  </div>
                )}
              />
            ) : null}
            <FormField control={form.control} name="expiresAt" label={t("fields.expiresAt")}>
              {(field) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  fromDate={new Date()}
                />
              )}
            </FormField>
          </FormSection>
        }
      >
        <FormSection title={t("sections.content")}>
          <FormField control={form.control} name="title" label={t("fields.title")} required>
            {(field) => <Input {...field} maxLength={200} autoFocus />}
          </FormField>
          <FormField control={form.control} name="body" label={t("fields.body")}>
            {(field) => <Textarea {...field} rows={4} />}
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="level" label={t("fields.level")} required>
              {(field) => (
                <SelectField
                  options={(["INFO", "WARNING", "ERROR"] as const).map((level) => ({
                    value: level,
                    label: t(`level.${level}`),
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="link"
              label={t("fields.link")}
              description={t("fields.linkHint")}
            >
              {(field) => <Input {...field} placeholder="/quan-tri" />}
            </FormField>
          </div>
        </FormSection>
      </FormLayout>
      <FormActions>
        <Button type="button" variant="outline" asChild>
          <Link href={SYSTEM_ROUTES.announcements}>{tCommon("cancel")}</Link>
        </Button>
        <FormSubmitButton isSubmitting={isSubmitting}>{t("send")}</FormSubmitButton>
      </FormActions>
    </Form>
  );
}
