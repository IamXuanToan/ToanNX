"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { CUSTOM_PAGES_ROUTES } from "../../../constants/routes";
import { useCreatePagePath } from "../../../hooks/use-create-page-path";
import { useUpdatePagePath } from "../../../hooks/use-update-page-path";
import {
  fromPagePath,
  PAGE_PATH_DEFAULTS,
  PAGE_PATH_FORM_FIELDS,
  pagePathSchema,
  type PagePathFormValues,
  toPagePathInput,
} from "../../../schemas/page-path.schema";
import type { PagePath } from "../../../types/page-path.types";

/**
 * State form đường dẫn giữa **dùng chung cho trang riêng và dialog tạo/sửa nhanh**. Có `onSaved` (dialog) thì
 * gọi sau khi lưu; không thì tạo → sang trang chi tiết.
 *
 * @param params - Đường dẫn đang sửa, callback sau lưu.
 * @returns Form, submit, trạng thái.
 */
export function usePagePathForm({
  path,
  onSaved,
}: {
  path?: PagePath;
  onSaved?: (path: PagePath) => unknown;
}) {
  const t = useTranslations("customPages.validation");
  const router = useRouter();
  const create = useCreatePagePath();
  const update = useUpdatePagePath(path?.id ?? "");
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => pagePathSchema(t), [t]);
  const form = useForm<PagePathFormValues>({
    resolver: zodResolver(schema),
    defaultValues: PAGE_PATH_DEFAULTS,
    values: path ? fromPagePath(path) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let saved: PagePath;
    try {
      saved = path
        ? await update.mutateAsync(toPagePathInput(values))
        : await create.mutateAsync(toPagePathInput(values));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = PAGE_PATH_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
      return;
    }
    if (onSaved) await onSaved(saved);
    else if (!path) router.push(CUSTOM_PAGES_ROUTES.pathDetail(saved.id));
  });

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
