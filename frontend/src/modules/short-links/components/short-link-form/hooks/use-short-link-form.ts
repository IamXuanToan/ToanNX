"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";
import { formatDateTimeLocal, parseDateTimeLocal } from "@/shares/lib/date-time-input";

import { SHORT_LINKS_ROUTES } from "../../../constants/routes";
import { useCreateShortLink, useUpdateShortLink } from "../../../hooks/use-short-links";
import {
  SHORT_LINK_FORM_FIELDS,
  shortLinkSchema,
  type ShortLinkFormValues,
} from "../../../schemas/short-link.schema";
import type { ShortLinkDetail, ShortLinkInput } from "../../../types/short-links.types";

const EMPTY: ShortLinkFormValues = {
  name: "",
  slug: "",
  destinationUrl: "",
  description: "",
  redirectType: "302",
  isActive: true,
  expiresAt: "",
};

function fromLink(link: ShortLinkDetail): ShortLinkFormValues {
  return {
    name: link.name,
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    description: link.description,
    redirectType: String(link.redirectType) as "301" | "302",
    isActive: link.status === "ACTIVE",
    expiresAt: link.expiresAt ? formatDateTimeLocal(new Date(link.expiresAt)) : "",
  };
}

function toInput(values: ShortLinkFormValues): ShortLinkInput {
  const expires = parseDateTimeLocal(values.expiresAt);
  return {
    name: values.name,
    slug: values.slug || undefined,
    destinationUrl: values.destinationUrl,
    description: values.description,
    redirectType: Number(values.redirectType) as 301 | 302,
    status: values.isActive ? "ACTIVE" : "INACTIVE",
    expiresAt: expires ? expires.toISOString() : null,
  };
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
  const t = useTranslations("shortLinks.validation");
  const router = useRouter();
  const create = useCreateShortLink();
  const update = useUpdateShortLink(link?.id ?? "");
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => shortLinkSchema(t), [t]);
  const form = useForm<ShortLinkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    values: link ? fromLink(link) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let saved: ShortLinkDetail;
    try {
      saved = link
        ? await update.mutateAsync(toInput(values))
        : await create.mutateAsync(toInput(values));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = SHORT_LINK_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
      return;
    }
    if (onSaved) await onSaved(saved);
    else if (!link) router.push(SHORT_LINKS_ROUTES.linkDetail(saved.id));
  });

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
