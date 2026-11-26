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
import { useSaveMonitorTarget } from "../../../hooks/use-save-monitor-target";
import {
  MONITOR_TARGET_FORM_FIELDS,
  monitorTargetSchema,
  type MonitorTargetFormValues,
} from "../../../schemas/monitor-target.schema";
import type { MonitorTarget } from "../../../types/monitor-target.types";

function toFormValues(item: MonitorTarget): MonitorTargetFormValues {
  return {
    name: item.name,
    url: item.url,
    method: item.method,
    expectedStatus: String(item.expectedStatus),
    timeoutSeconds: String(item.timeoutSeconds),
    checkIntervalMinutes: String(item.checkIntervalMinutes),
    isActive: item.isActive,
  };
}

/** @param item - Endpoint Uptime đang sửa. @returns State form MonitorTarget. */
export function useMonitorTargetForm(item?: MonitorTarget) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const router = useRouter();
  const save = useSaveMonitorTarget(item?.id);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => monitorTargetSchema(tValidation), [tValidation]);

  const form = useForm<MonitorTargetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      url: "",
      method: "GET",
      expectedStatus: "200",
      timeoutSeconds: "4",
      checkIntervalMinutes: "30",
      isActive: true,
    },
    values: item ? toFormValues(item) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        name: values.name,
        url: values.url,
        method: values.method,
        expectedStatus: Number(values.expectedStatus),
        timeoutSeconds: Number(values.timeoutSeconds),
        checkIntervalMinutes: Number(values.checkIntervalMinutes),
        isActive: values.isActive,
      });
      if (!item) {
        toast.success(tCommon("created"));
        router.push(WORKSPACE_ROUTES.monitorDetail(saved.id));
      } else {
        toast.success(tCommon("updated"));
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = MONITOR_TARGET_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, onSubmit, isSubmitting: save.isPending };
}
