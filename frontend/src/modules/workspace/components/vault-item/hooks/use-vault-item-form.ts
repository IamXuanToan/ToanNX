"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useSaveVaultItem } from "../../../hooks/use-save-vault-item";
import {
  VAULT_ITEM_FORM_FIELDS,
  vaultItemSchema,
  type VaultItemFormValues,
} from "../../../schemas/vault-item.schema";
import type { VaultItem } from "../../../types/vault-item.types";

function toFormValues(item: VaultItem): VaultItemFormValues {
  return {
    title: item.title,
    category: item.category,
    username: item.username,
    secret: "",
    url: item.url,
    notes: item.notes,
    tags: item.tags ?? [],
  };
}

/** @param item - Mục Két sắt đang sửa. @returns Form Két sắt bí mật. */
export function useVaultItemForm(item?: VaultItem) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const router = useRouter();
  const save = useSaveVaultItem(item?.id);
  const errorMessage = useApiErrorMessage();
  const isCreate = !item;
  const schema = useMemo(() => vaultItemSchema(tValidation, isCreate), [tValidation, isCreate]);

  const form = useForm<VaultItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: "SERVER",
      username: "",
      secret: "",
      url: "",
      notes: "",
      tags: [],
    },
    values: item ? toFormValues(item) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(
        isCreate
          ? {
              title: values.title,
              category: values.category,
              username: values.username,
              secret: values.secret,
              url: values.url,
              notes: values.notes,
              tags: values.tags,
            }
          : {
              title: values.title,
              category: values.category,
              username: values.username,
              ...(values.secret ? { secret: values.secret } : {}),
              url: values.url,
              notes: values.notes,
              tags: values.tags,
            },
      );
      if (isCreate) {
        toast.success(tCommon("created"));
        router.push(WORKSPACE_ROUTES.vaultDetail(saved.id));
      } else {
        toast.success(tCommon("updated"));
        form.setValue("secret", "");
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = VAULT_ITEM_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, onSubmit, isSubmitting: save.isPending, isCreate };
}
