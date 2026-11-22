"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";
import { formatDateTimeLocal, parseDateTimeLocal } from "@/shares/lib/date-time-input";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useCreateShortLink } from "../../../hooks/use-create-short-link";
import { useUpdateShortLink } from "../../../hooks/use-update-short-link";
import {
  SHORT_LINK_FORM_FIELDS,
  shortLinkSchema,
  type ShortLinkFormValues,
} from "../../../schemas/short-link.schema";
import type { ShortLinkDetail, ShortLinkInput } from "../../../types/short-link.types";

const EMPTY: ShortLinkFormValues = {
  name: "",
  slug: "",
  destinationUrl: "",
  description: "",
  redirectMode: "manual",
  autoRedirectSeconds: "5",
  password: "",
  removePassword: false,
  isActive: true,
  hasExpiry: false,
  expiresAt: "",
};

function fromLink(link: ShortLinkDetail): ShortLinkFormValues {
  return {
    name: link.name,
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    description: link.description,
    redirectMode: link.autoRedirectSeconds === null ? "manual" : "timed",
    autoRedirectSeconds: String(link.autoRedirectSeconds ?? 5),
    password: "",
    removePassword: false,
    isActive: link.status === "ACTIVE",
    hasExpiry: Boolean(link.expiresAt),
    expiresAt: link.expiresAt ? formatDateTimeLocal(new Date(link.expiresAt)) : "",
  };
}

function toInput(values: ShortLinkFormValues, editing: boolean): ShortLinkInput {
  const expires = parseDateTimeLocal(values.expiresAt);
  const input: ShortLinkInput = {
    name: values.name,
    slug: values.slug || undefined,
    destinationUrl: values.destinationUrl,
    description: values.description,
    autoRedirectSeconds:
      values.redirectMode === "timed" ? Number(values.autoRedirectSeconds) : null,
    status: values.isActive ? "ACTIVE" : "INACTIVE",
    expiresAt: values.hasExpiry && expires ? expires.toISOString() : null,
  };
  if (values.removePassword) input.password = "";
  else if (values.password || !editing) input.password = values.password;
  return input;
}

/**
 * State form link rút gọn **dùng chung cho tạo, sửa và dialog tạo/sửa nhanh**. Lưu xong: có `onSaved` thì
 * gọi (dialog), không thì tạo → sang trang chi tiết.
 *
 * @param params - Link đang sửa, callback sau khi lưu.
 * @returns Form, submit, trạng thái.
 */
export function useShortLinkForm({
  link,
  onSaved,
}: {
  link?: ShortLinkDetail;
  onSaved?: (link: ShortLinkDetail) => unknown;
}) {
  const t = useTranslations("utilities.shortLinks.validation");
  const router = useRouter();
  const create = useCreateShortLink();
  const update = useUpdateShortLink(link?.id ?? "");
  const errorMessage = useApiErrorMessage();
  const existingExpiry = link?.expiresAt
    ? formatDateTimeLocal(new Date(link.expiresAt))
    : undefined;
  const schema = useMemo(() => shortLinkSchema(t, existingExpiry), [t, existingExpiry]);
  const form = useForm<ShortLinkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    values: link ? fromLink(link) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let saved: ShortLinkDetail;
    try {
      const input = toInput(values, Boolean(link));
      if (
        link &&
        values.hasExpiry === Boolean(link.expiresAt) &&
        values.expiresAt === existingExpiry
      ) {
        delete input.expiresAt;
      }
      saved = link ? await update.mutateAsync(input) : await create.mutateAsync(input);
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = SHORT_LINK_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
      return;
    }
    if (onSaved) await onSaved(saved);
    else if (!link) router.push(UTILITIES_ROUTES.shortLinkDetail(saved.id));
  });

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
