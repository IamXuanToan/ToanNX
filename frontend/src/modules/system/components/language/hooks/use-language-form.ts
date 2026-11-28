"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useCreateLanguage } from "../../../hooks/use-create-language";
import { useUpdateLanguage } from "../../../hooks/use-update-language";
import { languageFormSchema, type LanguageFormValues } from "../../../schemas/language.schema";
import type { LanguageItem } from "../../../types/language.types";

/**
 * State form tạo/cập nhật Ngôn ngữ (`Language`).
 *
 * @param options - Ngôn ngữ hiện có (nếu sửa) và callback sau khi lưu.
 * @returns Form RHF và handler submit.
 */
export function useLanguageForm({
  initial,
  onSuccess,
}: {
  initial?: LanguageItem | null;
  onSuccess?: (saved: LanguageItem) => void;
}) {
  const t = useTranslations("system.languages");
  const router = useRouter();
  const createMutation = useCreateLanguage();
  const updateMutation = useUpdateLanguage();

  const form = useForm<LanguageFormValues>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      nativeName: initial?.nativeName ?? "",
      flagEmoji: initial?.flagEmoji ?? "",
      isActive: initial?.isActive ?? true,
      sortOrder: initial?.sortOrder ?? 10,
    },
  });

  useEffect(() => {
    if (!initial) return;
    form.reset({
      code: initial.code,
      name: initial.name,
      nativeName: initial.nativeName ?? "",
      flagEmoji: initial.flagEmoji ?? "",
      isActive: initial.isActive,
      sortOrder: initial.sortOrder,
    });
  }, [form, initial]);

  const submit = form.handleSubmit(async (values) => {
    if (initial) {
      const saved = await updateMutation.mutateAsync({
        id: initial.id,
        input: {
          name: values.name,
          nativeName: values.nativeName ?? "",
          flagEmoji: values.flagEmoji ?? "",
          isActive: values.isActive,
          sortOrder: values.sortOrder,
        },
      });
      toast.success(t("updated"));
      onSuccess?.(saved);
      return;
    }

    const saved = await createMutation.mutateAsync({
      code: values.code,
      name: values.name,
      nativeName: values.nativeName ?? "",
      flagEmoji: values.flagEmoji ?? "",
      isActive: values.isActive,
      sortOrder: values.sortOrder,
    });
    toast.success(t("created"));
    if (onSuccess) {
      onSuccess(saved);
    } else {
      router.replace(SYSTEM_ROUTES.languageDetail(saved.id));
    }
  });

  return {
    form,
    submit,
    isPending: createMutation.isPending || updateMutation.isPending,
  };
}
