"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { FINANCE_ROUTES } from "../constants/routes";
import { useClassificationRule } from "../hooks/use-classification-rule";
import { ClassificationRuleForm } from "./classification-rule-form";

/** @param props - Id, quyền sửa, slot lịch sử. @returns Chi tiết quy tắc. */
export function ClassificationRuleProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const query = useClassificationRule(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={FINANCE_ROUTES.rules}
      />
    );
  return (
    <FormPage title={query.data.name}>
      <ClassificationRuleForm rule={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
