"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useVaultItemDetail } from "./hooks/use-vault-item-detail";
import { VaultItemForm } from "./vault-item-form";
import { VaultRevealDialog } from "./vault-reveal-dialog";

/**
 * Trang chi tiết mục Két sắt: 2 tab (`general`, `history`) đồng bộ `?tab=`, kèm nút Giải mã
 * có kiểm quyền `workspace.vault_item.reveal` trên header.
 *
 * @param props - ID mục két sắt, quyền sửa/giải mã, slot lịch sử.
 * @returns Chi tiết mục Két sắt.
 */
export function VaultItemDetail({
  id,
  canUpdate,
  canReveal,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canReveal: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.vault");
  const tCommon = useTranslations("workspace.common");
  const state = useVaultItemDetail(id);
  const { query, activeTab, setActiveTab } = state;

  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={WORKSPACE_ROUTES.vault}
      />
    );
  }

  return (
    <FormPage
      title={query.data.title || t("editTitle")}
      actions={
        canReveal ? (
          <Button type="button" variant="outline" onClick={() => void state.openReveal()}>
            <Eye />
            {t("reveal")}
          </Button>
        ) : null
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="general">{tCommon("tabGeneral")}</TabsTrigger>
          {history ? <TabsTrigger value="history">{tCommon("tabHistory")}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <VaultItemForm item={query.data} disabled={!canUpdate} />
        </TabsContent>
        {history ? (
          <TabsContent value="history" className="mt-4">
            {history}
          </TabsContent>
        ) : null}
      </Tabs>

      <VaultRevealDialog
        open={state.revealOpen}
        onOpenChange={state.closeReveal}
        title={query.data.title}
        revealed={state.revealDialog.revealed}
        isRevealing={state.revealDialog.isRevealing}
        onCopy={() => void state.revealDialog.copySecret()}
      />
    </FormPage>
  );
}
