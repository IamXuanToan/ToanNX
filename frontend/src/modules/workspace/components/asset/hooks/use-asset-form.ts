"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import type { Attachment } from "@/modules/system/types/attachment.types";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useSaveAsset } from "../../../hooks/use-save-asset";
import {
  ASSET_FORM_FIELDS,
  assetSchema,
  type AssetFormValues,
} from "../../../schemas/asset.schema";
import type { Asset, AssetInput } from "../../../types/asset.types";

function toFormValues(asset: Asset): AssetFormValues {
  return {
    name: asset.name,
    brand: asset.brand,
    modelCode: asset.modelCode,
    category: asset.category,
    serialNumber: asset.serialNumber,
    imei: asset.imei,
    status: asset.status,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice ? String(Number(asset.purchasePrice)) : "0",
    currencyId: asset.currencyId,
    exchangeRate:
      asset.exchangeRate && Number(asset.exchangeRate) !== 1
        ? String(Number(asset.exchangeRate))
        : "",
    purchaseStore: asset.purchaseStore,
    purchaseChannel: asset.purchaseChannel,
    purchaseBranchAddress: asset.purchaseBranchAddress,
    purchaseOrderCode: asset.purchaseOrderCode,
    purchaseOrderUrl: asset.purchaseOrderUrl,
    storeWarrantyContact: asset.storeWarrantyContact,
    warrantyType: asset.warrantyType,
    warrantyMonths: asset.warrantyMonths !== null ? String(asset.warrantyMonths) : "",
    warrantyStartDate: asset.warrantyStartDate ?? "",
    warrantyEndDate: asset.warrantyEndDate ?? "",
    warrantyProvider: asset.warrantyProvider,
    warrantyNote: asset.warrantyNote,
    invoiceAttachmentIds: asset.invoiceAttachments.map((f) => f.id),
    notes: asset.notes,
    notificationChannels: asset.notificationChannels?.length
      ? asset.notificationChannels
      : ["WEBSITE"],
  };
}

/** @param asset - Thiết bị đang sửa (trống khi tạo mới). @returns Form, submit, tệp hóa đơn, tiền tệ. */
export function useAssetForm(asset?: Asset) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const router = useRouter();
  const save = useSaveAsset(asset?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const baseCurrency = currencies.data?.find((c) => c.isBase);
  const schema = useMemo(() => assetSchema(tValidation), [tValidation]);
  const [files, setFiles] = useState<Attachment[]>(asset?.invoiceAttachments ?? []);

  const empty: AssetFormValues = {
    name: "",
    brand: "",
    modelCode: "",
    category: "OTHER",
    serialNumber: "",
    imei: "",
    status: "IN_USE",
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: "0",
    currencyId: baseCurrency?.id ?? "",
    exchangeRate: "",
    purchaseStore: "",
    purchaseChannel: "RETAILER",
    purchaseBranchAddress: "",
    purchaseOrderCode: "",
    purchaseOrderUrl: "",
    storeWarrantyContact: "",
    warrantyType: "MANUFACTURER",
    warrantyMonths: "",
    warrantyStartDate: "",
    warrantyEndDate: "",
    warrantyProvider: "",
    warrantyNote: "",
    invoiceAttachmentIds: [],
    notes: "",
    notificationChannels: ["WEBSITE"],
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    values: asset ? toFormValues(asset) : baseCurrency ? empty : undefined,
  });

  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrency = currencies.data?.find((c) => c.id === currencyId);

  const onSubmit = form.handleSubmit(async (values) => {
    const input: AssetInput = {
      name: values.name,
      brand: values.brand,
      modelCode: values.modelCode,
      category: values.category,
      serialNumber: values.serialNumber,
      imei: values.imei,
      status: values.status,
      purchaseDate: values.purchaseDate,
      purchasePrice: values.purchasePrice || "0",
      currencyId: values.currencyId,
      exchangeRate: values.exchangeRate ? values.exchangeRate : null,
      purchaseStore: values.purchaseStore,
      purchaseChannel: values.purchaseChannel,
      purchaseBranchAddress: values.purchaseBranchAddress,
      purchaseOrderCode: values.purchaseOrderCode,
      purchaseOrderUrl: values.purchaseOrderUrl,
      storeWarrantyContact: values.storeWarrantyContact,
      warrantyType: values.warrantyType,
      warrantyMonths: values.warrantyMonths ? Number(values.warrantyMonths) : null,
      warrantyStartDate: values.warrantyStartDate || null,
      warrantyEndDate: values.warrantyEndDate || null,
      warrantyProvider: values.warrantyProvider,
      warrantyNote: values.warrantyNote,
      invoiceAttachmentIds: values.invoiceAttachmentIds,
      notes: values.notes,
      notificationChannels: values.notificationChannels,
    };
    try {
      const saved = await save.mutateAsync(input);
      if (!asset) {
        toast.success(tCommon("created"));
        router.push(WORKSPACE_ROUTES.assetDetail(saved.id));
      } else {
        toast.success(tCommon("updated"));
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = ASSET_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    files,
    addFiles: (selected: Attachment[]) => {
      const merged = [
        ...files,
        ...selected.filter((file) => !files.some((item) => item.id === file.id)),
      ];
      setFiles(merged);
      form.setValue(
        "invoiceAttachmentIds",
        merged.map((file) => file.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    removeFile: (id: string) => {
      const next = files.filter((file) => file.id !== id);
      setFiles(next);
      form.setValue(
        "invoiceAttachmentIds",
        next.map((file) => file.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    isForeign: Boolean(selectedCurrency && !selectedCurrency.isBase),
    currencyOptions: (currencies.data ?? [])
      .filter((item) => item.isActive || item.id === asset?.currencyId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  };
}
