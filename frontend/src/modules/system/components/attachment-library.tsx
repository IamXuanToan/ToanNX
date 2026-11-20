"use client";

import { cn } from "cn";
import { FolderInput, Images, PanelRight, RotateCw, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { DataPagination } from "@/shares/components/common/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { PageHeader } from "@/shares/components/common/page-header";
import { SearchInput } from "@/shares/components/common/search-input";
import { SelectField } from "@/shares/components/common/select-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import type { AttachmentCapabilities } from "../types/attachment.types";
import { AttachmentDetails } from "./attachment-details";
import { AttachmentDetailDialog } from "./attachment-detail-dialog";
import { AttachmentEditDialog } from "./attachment-edit-dialog";
import { AttachmentGrid } from "./attachment-grid";
import { AttachmentUpload } from "./attachment-upload";
import { useAttachmentLibrary } from "./hooks/use-attachment-library";
import { AttachmentMediaFilters } from "./attachment-media-filters";
import { AttachmentFolderFilter } from "./attachment-folder-filter";
import { AttachmentFolderManager } from "./attachment-folder-manager";
import { AttachmentMoveDialog } from "./attachment-move-dialog";

/** @param capabilities - Quyền giao diện từ view. @returns Thư viện phương án B: lưới và panel, mobile có dialog chi tiết. */
export function AttachmentLibrary(capabilities: AttachmentCapabilities) {
  const t = useTranslations("system.attachment");
  const tChoice = useTranslations("common.choice");
  const state = useAttachmentLibrary(capabilities);
  const {
    table,
    query,
    showDetails,
    setShowDetails,
    editingFile,
    setEditingFile,
    filtered,
    deleteOne,
    inspect: handleInspect,
  } = state;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        inline
        actions={
          capabilities.canUpload ? (
            <Button
              onClick={() => state.setUploadOpen(true)}
              className="h-10 rounded-xl font-medium shadow-xs"
            >
              <Upload className="size-4" />
              {t("upload")}
            </Button>
          ) : undefined
        }
      />

      <Card className="space-y-3 rounded-xl p-4 shadow-2xs">
        {/* Hàng 1: Tìm kiếm + Select Sắp xếp + Nút Toggle Chi tiết + Nút Làm mới */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput
            {...table.search}
            placeholder={t("search")}
            className="h-10 min-w-0 flex-1 rounded-xl"
          />
          <div className="flex shrink-0 items-center gap-2">
            <div className="w-44 sm:w-48">
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
            <Button
              variant="outline"
              size="icon"
              className={cn("size-10 rounded-xl", showDetails && "bg-muted text-foreground")}
              aria-label={showDetails ? "Ẩn thông tin chi tiết" : "Hiện thông tin chi tiết"}
              title={showDetails ? "Ẩn thông tin chi tiết" : "Hiện thông tin chi tiết"}
              onClick={() => setShowDetails((prev) => !prev)}
            >
              <PanelRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl"
              aria-label={t("reload")}
              title={t("reload")}
              disabled={query.isFetching}
              onClick={() => query.refetch()}
            >
              <RotateCw className={cn("size-4", query.isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Hàng 2: Bộ lọc (Loại tệp, Đuôi tệp, Thư mục, Quản lý thư mục, Phạm vi) + Xóa lọc */}
        <div className="border-border/50 flex flex-wrap items-center gap-2 border-t pt-2.5">
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
          {filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={table.clearFilters}
              className="text-muted-foreground hover:text-foreground h-10 rounded-xl px-3"
            >
              <X className="mr-1.5 size-4" />
              {t("clearFiltersShort")}
            </Button>
          ) : null}
        </div>

        {/* Hàng 3: Thanh thao tác hàng loạt (Bulk Bar) - chỉ hiện khi có file được chọn */}
        {(capabilities.canDelete || capabilities.canMove) && state.selected.length > 0 ? (
          <div className="bg-primary/5 border-primary/20 animate-in fade-in-50 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-2.5 duration-150 sm:px-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary/15 text-primary inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums">
                {t("selectedCount", { count: state.selected.length, total: state.items.length })}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={state.locked || state.selected.length === state.items.length}
                onClick={state.selectAll}
                className="h-9 rounded-lg px-3 text-xs"
              >
                {tChoice("selectAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={state.locked}
                onClick={state.clearSelection}
                className="h-9 rounded-lg px-3 text-xs"
              >
                {t("clearSelection")}
              </Button>
              {capabilities.canMove ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.locked}
                  onClick={() => state.setPendingMove(state.selected)}
                  className="h-9 gap-1.5 rounded-lg px-3 text-xs"
                >
                  <FolderInput className="size-3.5" />
                  <span>{t("moveFiles")}</span>
                </Button>
              ) : null}
              {capabilities.canDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={state.locked}
                  onClick={() => state.setPendingDelete(state.selected)}
                  className="h-9 gap-1.5 rounded-lg px-3 text-xs font-medium"
                >
                  <Trash2 className="size-3.5" />
                  <span>{t("deleteSelected", { count: state.selected.length })}</span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      {query.isPending ? (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5"
          aria-label={t("loading")}
          aria-busy="true"
        >
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : state.items.length ? (
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-5",
            showDetails && state.active ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "",
          )}
        >
          <div
            className="flex min-w-0 flex-col justify-between space-y-8 sm:space-y-10"
            aria-busy={query.isFetching}
          >
            <div className="min-h-[280px] sm:min-h-[340px]">
              <AttachmentGrid
                files={state.items}
                activeId={state.active?.id}
                selectedIds={state.selectedIds}
                onInspect={handleInspect}
                onToggle={capabilities.canDelete || capabilities.canMove ? state.toggle : undefined}
                onViewDetails={(file) => {
                  handleInspect(file);
                  state.setDetailOpen(true);
                }}
                onEdit={(file) => setEditingFile(file)}
                disabled={state.locked}
              />
            </div>
            {query.data ? (
              <Card className="mt-auto rounded-xl p-4 shadow-2xs">
                <DataPagination
                  pagination={query.data.pagination}
                  onPageChange={table.onPageChange}
                  onPageSizeChange={table.onPageSizeChange}
                  disabled={state.locked}
                />
              </Card>
            ) : null}
          </div>
          {showDetails && state.active ? (
            <aside className="animate-in fade-in-50 sticky top-20 hidden min-w-0 duration-150 lg:block">
              <AttachmentDetails
                file={state.active}
                onDelete={deleteOne}
                onMove={capabilities.canMove ? (file) => state.setPendingMove([file]) : undefined}
                onClose={() => setShowDetails(false)}
                onUpdated={(updated) => handleInspect(updated)}
                disabled={state.locked}
              />
            </aside>
          ) : null}
        </div>
      ) : (
        <Card className="rounded-xl">
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
        </Card>
      )}

      <AttachmentDetailDialog
        file={state.active}
        open={state.detailOpen && Boolean(state.active)}
        onClose={() => state.setDetailOpen(false)}
        onDelete={deleteOne}
        onUpdated={(updated) => handleInspect(updated)}
        canEdit={Boolean(capabilities.canMove)}
        canDelete={capabilities.canDelete}
        disabled={state.locked}
      />

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

      <AttachmentEditDialog
        file={editingFile}
        open={Boolean(editingFile)}
        onClose={() => setEditingFile(null)}
        onSuccess={(updated) => {
          handleInspect(updated);
          setEditingFile(null);
        }}
      />
    </div>
  );
}
