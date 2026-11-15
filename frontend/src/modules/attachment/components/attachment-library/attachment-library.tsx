"use client";

import { Images, RotateCw, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog/confirm-dialog";
import { DataPagination } from "@/shares/components/common/data-pagination/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state/empty-state";
import { FilterSelect } from "@/shares/components/common/filter-select/filter-select";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { SearchInput } from "@/shares/components/common/search-input/search-input";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import type { AttachmentCapabilities } from "../../types/attachment.types";
import { AttachmentDetails } from "../attachment-details/attachment-details";
import { AttachmentGrid } from "../attachment-grid/attachment-grid";
import { AttachmentUpload } from "../attachment-upload/attachment-upload";
import { useAttachmentLibrary } from "./hooks/use-attachment-library";
import { AttachmentMediaFilters } from "../attachment-media-filters/attachment-media-filters";
import { AttachmentFolderFilter } from "../attachment-folder-filter/attachment-folder-filter";
import { AttachmentFolderManager } from "../attachment-folder-manager/attachment-folder-manager";
import { AttachmentMoveDialog } from "../attachment-move-dialog/attachment-move-dialog";

/** @param capabilities - Quyền giao diện từ view. @returns Thư viện phương án B: lưới và panel, mobile có dialog chi tiết. */
export function AttachmentLibrary(capabilities: AttachmentCapabilities) {
  const t = useTranslations("attachment");
  const tChoice = useTranslations("common.choice");
  const state = useAttachmentLibrary(capabilities);
  const { table, query } = state;
  const filtered = Boolean(table.keyword) || table.hasFilters;
  const deleteOne = capabilities.canDelete
    ? (file: NonNullable<typeof state.active>) => state.setPendingDelete([file])
    : undefined;
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        inline
        actions={
          capabilities.canUpload ? (
            <Button onClick={() => state.setUploadOpen(true)}>
              <Upload />
              {t("upload")}
            </Button>
          ) : undefined
        }
      />
      <section className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <SearchInput
            {...table.search}
            placeholder={t("search")}
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label={t("reload")}
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <RotateCw />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AttachmentMediaFilters
            kinds={state.kinds}
            formats={state.formats}
            onKindsChange={state.changeKinds}
            onFormatsChange={(values) => table.setFilterValues("contentType", values)}
          />
          <AttachmentFolderFilter
            canRead={Boolean(capabilities.folders?.canRead)}
            value={table.getFilterValues("folder")}
            onChange={(values) => table.setFilterValues("folder", values)}
          />
          <AttachmentFolderManager capabilities={capabilities.folders} />
          {capabilities.canManageAll ? (
            <FilterSelect
              label={t("scope")}
              value={table.getFilterValues("scope")}
              onValueChange={(values) => table.setFilterValues("scope", values)}
              options={[
                { value: "MINE", label: t("mine") },
                { value: "OTHERS", label: t("others") },
              ]}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-52">
            <SelectField
              aria-label={t("ordering")}
              value={table.ordering}
              onValueChange={table.onOrderingChange}
              options={[
                { value: "-created_at", label: t("newest") },
                { value: "created_at", label: t("oldest") },
                { value: "-size", label: t("largest") },
              ]}
            />
          </div>
          {filtered ? (
            <Button variant="ghost" onClick={table.clearFilters}>
              {t("clearFilters")}
            </Button>
          ) : null}
        </div>
        {(capabilities.canDelete || capabilities.canMove) && state.items.length ? (
          <div className="@container/selection border-t pt-3">
            <p className="text-muted-foreground text-xs tabular-nums">
              {t("selectedCount", { count: state.selected.length, total: state.items.length })}
            </p>
            {/* Theo bề rộng thực của toolbar để chữ không đẩy nút xóa sang ô bên cạnh. */}
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 @lg/selection:flex @lg/selection:justify-end">
              <Button
                variant="outline"
                disabled={state.locked || state.selected.length === state.items.length}
                onClick={state.selectAll}
                className="min-w-0 px-2 @lg/selection:px-4"
              >
                <span className="truncate">{tChoice("selectAll")}</span>
              </Button>
              <Button
                variant="outline"
                disabled={state.locked || !state.selected.length}
                onClick={state.clearSelection}
                className="min-w-0 px-2 @lg/selection:px-4"
              >
                <span className="truncate">{t("clearSelection")}</span>
              </Button>
              {capabilities.canDelete ? (
                <Button
                  variant="destructive"
                  disabled={state.locked || !state.selected.length}
                  onClick={() => state.setPendingDelete(state.selected)}
                  aria-label={t("deleteSelected", { count: state.selected.length })}
                  size="icon"
                  className="gap-2 @lg/selection:w-auto @lg/selection:px-4"
                >
                  <Trash2 />
                  <span className="hidden @lg/selection:inline">
                    {t("deleteSelected", { count: state.selected.length })}
                  </span>
                </Button>
              ) : null}
            </div>
            {capabilities.canMove ? (
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  disabled={state.locked || !state.selected.length}
                  onClick={() => state.setPendingMove(state.selected)}
                >
                  {t("moveFiles")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      {query.isPending ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-3"
          aria-label={t("loading")}
          aria-busy="true"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : state.items.length ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5" aria-busy={query.isFetching}>
            <AttachmentGrid
              files={state.items}
              activeId={state.active?.id}
              selectedIds={state.selectedIds}
              onInspect={state.inspect}
              onToggle={capabilities.canDelete || capabilities.canMove ? state.toggle : undefined}
              disabled={state.locked}
            />
            {query.data ? (
              <div className="bg-card rounded-xl border p-4">
                <DataPagination
                  pagination={query.data.pagination}
                  onPageChange={table.onPageChange}
                  onPageSizeChange={table.onPageSizeChange}
                  disabled={state.locked}
                />
              </div>
            ) : null}
          </div>
          {state.active ? (
            <aside className="sticky top-20 hidden min-w-0 lg:block">
              <AttachmentDetails
                file={state.active}
                onDelete={deleteOne}
                onMove={capabilities.canMove ? (file) => state.setPendingMove([file]) : undefined}
                disabled={state.locked}
              />
            </aside>
          ) : null}
        </div>
      ) : (
        <div className="bg-card rounded-xl border">
          <EmptyState
            title={filtered ? t("noResults") : t("empty")}
            description={!filtered ? t("emptyDescription") : undefined}
            icon={<Images />}
            action={
              filtered ? (
                <Button variant="outline" onClick={table.clearFilters}>
                  {t("clearFilters")}
                </Button>
              ) : capabilities.canUpload ? (
                <Button onClick={() => state.setUploadOpen(true)}>{t("upload")}</Button>
              ) : undefined
            }
          />
        </div>
      )}
      <Dialog open={state.detailOpen && Boolean(state.active)} onOpenChange={state.setDetailOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("details")}</DialogTitle>
            <DialogDescription className="sr-only">{state.active?.originalName}</DialogDescription>
          </DialogHeader>
          {state.active ? (
            <AttachmentDetails
              file={state.active}
              onDelete={deleteOne}
              onMove={
                capabilities.canMove
                  ? (file) => {
                      state.setDetailOpen(false);
                      state.setPendingMove([file]);
                    }
                  : undefined
              }
              disabled={state.locked}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={state.uploadOpen}
        onOpenChange={(open) => !state.uploadBusy && state.setUploadOpen(open)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>{t("upload")}</DialogTitle>
            <DialogDescription className="sr-only">{t("uploadHint")}</DialogDescription>
          </DialogHeader>
          <AttachmentUpload
            folders={capabilities.folders}
            onUploaded={state.uploaded}
            onBusyChange={state.setUploadBusy}
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={state.uploadBusy}
              onClick={() => state.setUploadOpen(false)}
            >
              {t("done")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {state.pendingMove.length ? (
        <AttachmentMoveDialog
          files={state.pendingMove}
          canReadFolders={Boolean(capabilities.folders?.canRead)}
          onClose={() => state.setPendingMove([])}
          onDone={() => {
            state.setPendingMove([]);
            state.clearSelection();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(state.pendingDelete.length)}
        onOpenChange={(open) => !open && state.setPendingDelete([])}
        title={t("deleteTitle", { count: state.pendingDelete.length })}
        description={t("deleteDescription")}
        confirmLabel={t("deleteSelected", { count: state.pendingDelete.length })}
        onConfirm={state.confirmDelete}
        isPending={state.isDeleting}
      />
    </div>
  );
}
