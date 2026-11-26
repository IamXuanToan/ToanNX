"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
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
import { useAssetOptions } from "../../../hooks/use-asset-options";
import { useSaveWarrantyClaim } from "../../../hooks/use-save-warranty-claim";
import {
  ASSET_WARRANTY_CLAIM_FORM_FIELDS,
  assetWarrantyClaimSchema,
  type AssetWarrantyClaimFormValues,
} from "../../../schemas/asset-warranty-claim.schema";
import type {
  AssetWarrantyClaim,
  AssetWarrantyClaimInput,
} from "../../../types/asset-warranty-claim.types";

function toFormValues(claim: AssetWarrantyClaim): AssetWarrantyClaimFormValues {
  return {
    assetId: claim.assetId,
    claimCode: claim.claimCode,
    claimType: claim.claimType,
    status: claim.status,
    submittedDate: claim.submittedDate,
    estimatedReturnDate: claim.estimatedReturnDate ?? "",
    returnedDate: claim.returnedDate ?? "",
    serviceCenter: claim.serviceCenter,
    serviceCenterAddress: claim.serviceCenterAddress,
    serviceCenterContact: claim.serviceCenterContact,
    externalTicketCode: claim.externalTicketCode,
    issueDescription: claim.issueDescription,
    resolutionNotes: claim.resolutionNotes,
    isCoveredByWarranty: claim.isCoveredByWarranty,
    cost: claim.cost ? String(Number(claim.cost)) : "0",
    currencyId: claim.currencyId,
    exchangeRate:
      claim.exchangeRate && Number(claim.exchangeRate) !== 1
        ? String(Number(claim.exchangeRate))
        : "",
    partWarrantyMonths: claim.partWarrantyMonths !== null ? String(claim.partWarrantyMonths) : "",
    partWarrantyEndDate: claim.partWarrantyEndDate ?? "",
    attachmentIds: claim.attachments.map((f) => f.id),
  };
}

/** @param claim - Phiếu đang sửa. @returns State form phiếu bảo hành (tự nhận `?assetId=`). */
export function useWarrantyClaimForm(claim?: AssetWarrantyClaim) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const searchParams = useSearchParams();
  const initialAssetId = searchParams?.get("assetId") ?? "";
  const router = useRouter();
  const save = useSaveWarrantyClaim(claim?.id);
  const errorMessage = useApiErrorMessage();
  const assets = useAssetOptions();
  const currencies = useCurrencyOptions();
  const baseCurrency = currencies.data?.find((c) => c.isBase);
  const schema = useMemo(() => assetWarrantyClaimSchema(tValidation), [tValidation]);
  const [files, setFiles] = useState<Attachment[]>(claim?.attachments ?? []);

  const empty: AssetWarrantyClaimFormValues = {
    assetId: initialAssetId,
    claimCode: "",
    claimType: "WARRANTY",
    status: "SUBMITTED",
    submittedDate: new Date().toISOString().slice(0, 10),
    estimatedReturnDate: "",
    returnedDate: "",
    serviceCenter: "",
    serviceCenterAddress: "",
    serviceCenterContact: "",
    externalTicketCode: "",
    issueDescription: "",
    resolutionNotes: "",
    isCoveredByWarranty: true,
    cost: "0",
    currencyId: baseCurrency?.id ?? "",
    exchangeRate: "",
    partWarrantyMonths: "",
    partWarrantyEndDate: "",
    attachmentIds: [],
  };

  const form = useForm<AssetWarrantyClaimFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    values: claim ? toFormValues(claim) : baseCurrency ? empty : undefined,
  });

  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrency = currencies.data?.find((c) => c.id === currencyId);

  const onSubmit = form.handleSubmit(async (values) => {
    const input: AssetWarrantyClaimInput = {
      assetId: values.assetId,
      claimCode: values.claimCode,
      claimType: values.claimType,
      status: values.status,
      submittedDate: values.submittedDate,
      estimatedReturnDate: values.estimatedReturnDate || null,
      returnedDate: values.returnedDate || null,
      serviceCenter: values.serviceCenter,
      serviceCenterAddress: values.serviceCenterAddress,
      serviceCenterContact: values.serviceCenterContact,
      externalTicketCode: values.externalTicketCode,
      issueDescription: values.issueDescription,
      resolutionNotes: values.resolutionNotes,
      isCoveredByWarranty: values.isCoveredByWarranty,
      cost: values.cost || "0",
      currencyId: values.currencyId,
      exchangeRate: values.exchangeRate || null,
      partWarrantyMonths: values.partWarrantyMonths ? Number(values.partWarrantyMonths) : null,
      partWarrantyEndDate: values.partWarrantyEndDate || null,
      attachmentIds: values.attachmentIds,
    };
    try {
      const saved = await save.mutateAsync(input);
      if (!claim) {
        toast.success(tCommon("created"));
        router.push(WORKSPACE_ROUTES.warrantyClaimDetail(saved.id));
      } else {
        toast.success(tCommon("updated"));
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = ASSET_WARRANTY_CLAIM_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    assetOptions: assets.options,
    files,
    addFiles: (selected: Attachment[]) => {
      const merged = [...files, ...selected.filter((f) => !files.some((item) => item.id === f.id))];
      setFiles(merged);
      form.setValue(
        "attachmentIds",
        merged.map((f) => f.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    removeFile: (id: string) => {
      const next = files.filter((f) => f.id !== id);
      setFiles(next);
      form.setValue(
        "attachmentIds",
        next.map((f) => f.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    isForeign: Boolean(selectedCurrency && !selectedCurrency.isBase),
    currencyOptions: (currencies.data ?? [])
      .filter((item) => item.isActive || item.id === claim?.currencyId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  };
}
