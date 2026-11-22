"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { FINANCE_ROUTES } from "../../constants/routes";
import { usePlatformOptions } from "../../hooks/use-platform-options";
import { useSaveClassificationRule } from "../../hooks/use-save-classification-rule";
import {
  RULE_FORM_FIELDS,
  classificationRuleSchema,
  type ClassificationRuleFormValues,
} from "../../schemas/classification-rule.schema";
import type { ClassificationRule } from "../../types/classification-rule.types";

const EMPTY: ClassificationRuleFormValues = {
  name: "",
  platformId: "",
  pattern: "",
  priority: "100",
  isActive: true,
};

/** @param rule - Quy tắc đang sửa. @returns Form, submit, lựa chọn nền tảng. */
export function useClassificationRuleForm(rule?: ClassificationRule) {
  const t = useTranslations("finance.validation");
  const router = useRouter();
  const save = useSaveClassificationRule(rule?.id);
  const errorMessage = useApiErrorMessage();
  const platforms = usePlatformOptions();
  const schema = useMemo(() => classificationRuleSchema(t), [t]);
  const form = useForm<ClassificationRuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    values: rule
      ? {
          name: rule.name,
          platformId: rule.platformId,
          pattern: rule.pattern,
          priority: String(rule.priority),
          isActive: rule.isActive,
        }
      : undefined,
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({ ...values, priority: Number(values.priority) });
      if (!rule) router.push(FINANCE_ROUTES.ruleDetail(saved.id));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = RULE_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });
  const platformOptions = (platforms.data ?? []).map((platform) => ({
    value: platform.id,
    label: platform.name,
  }));
  return { form, onSubmit, isSubmitting: save.isPending, platformOptions };
}
