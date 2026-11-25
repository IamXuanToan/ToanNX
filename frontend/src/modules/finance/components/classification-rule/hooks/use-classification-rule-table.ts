"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { financeKeys } from "../../../constants/query-keys";
import { classificationRuleService } from "../../../services/classification-rule.service";
import { useFinancePersonalScope } from "../../../hooks/use-finance-personal-scope";
import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useClassificationRules } from "../../../hooks/use-classification-rules";
import { useDeleteClassificationRule } from "../../../hooks/use-delete-classification-rule";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import type { ClassificationRule } from "../../../types/classification-rule.types";

/** @returns State bảng quy tắc (lọc theo nền tảng). */
export function useClassificationRuleTable() {
  const router = useRouter();
  const routes = useFinanceRoutes();
  const { personalOwnerId, scopeReady } = useFinancePersonalScope();
  const table = useTableState({ ordering: "-priority", filterKeys: ["platform"] });
  const query = useClassificationRules(
    {
      ...table.filters,
      owner: personalOwnerId ?? undefined,
      platform: table.extraFilters.platform,
    },
    { enabled: scopeReady },
  );
  const platforms = usePlatformOptions();
  const remove = useDeleteClassificationRule();
  const bulk = useBulkActions<ClassificationRule>({
    service: classificationRuleService,
    invalidate: [financeKeys.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    bulkSetActive: (rows: ClassificationRule[], value: boolean) =>
      bulk.bulkUpdate(rows, { isActive: value }),
    table,
    query,
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    view: (rule: ClassificationRule) => router.push(routes.ruleDetail(rule.id)),
    edit: (rule: ClassificationRule) => router.push(withEditMode(routes.ruleDetail(rule.id))),
    remove: (rule: ClassificationRule) => remove.mutateAsync(rule.id),
  };
}
