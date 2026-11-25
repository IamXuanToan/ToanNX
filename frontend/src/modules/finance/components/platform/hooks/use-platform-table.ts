"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { financeKeys } from "../../../constants/query-keys";
import { platformService } from "../../../services/platform.service";
import { useFinancePersonalScope } from "../../../hooks/use-finance-personal-scope";
import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useDeletePlatform } from "../../../hooks/use-delete-platform";
import { usePlatforms } from "../../../hooks/use-platforms";
import { useSeedPlatforms } from "../../../hooks/use-seed-platforms";
import type { Platform } from "../../../types/platform.types";

/** @returns State bảng nền tảng + tạo bộ mẫu. */
export function usePlatformTable() {
  const router = useRouter();
  const routes = useFinanceRoutes();
  const { personalOwnerId, scopeReady } = useFinancePersonalScope();
  const table = useTableState({ ordering: "name", filterKeys: ["isActive"] });
  const query = usePlatforms(
    {
      ...table.filters,
      owner: personalOwnerId ?? undefined,
      isActive: table.extraFilters.isActive,
    },
    { enabled: scopeReady },
  );
  const remove = useDeletePlatform();
  const seed = useSeedPlatforms();
  const bulk = useBulkActions<Platform>({
    service: platformService,
    invalidate: [financeKeys.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    bulkSetActive: (rows: Platform[], value: boolean) => bulk.bulkUpdate(rows, { isActive: value }),
    table,
    query,
    view: (platform: Platform) => router.push(routes.platformDetail(platform.id)),
    edit: (platform: Platform) => router.push(withEditMode(routes.platformDetail(platform.id))),
    remove: (platform: Platform) => remove.mutateAsync(platform.id),
    seed: () => seed.mutate(),
    isSeeding: seed.isPending,
  };
}
