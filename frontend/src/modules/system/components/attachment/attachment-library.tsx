"use client";

import { cn } from "cn";
import { FolderInput, Images, RotateCw, Trash2, Upload, X } from "lucide-react";
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

import type { AttachmentCapabilities } from "../../types/attachment.types";
import { useAdminSessionUsers } from "../../hooks/use-admin-session-users";
import { AttachmentDetailDialog } from "./attachment-detail-dialog";
import { AttachmentEditDialog } from "./attachment-edit-dialog";
import { AttachmentGrid } from "./attachment-grid";
import { AttachmentViewModeToggle } from "./attachment-view-mode-toggle";
import { useAttachmentViewMode } from "./hooks/use-attachment-view-mode";
import { AttachmentUpload } from "./attachment-upload";
import { useAttachmentLibrary } from "./hooks/use-attachment-library";
import { AttachmentMediaFilters } from "./attachment-media-filters";
import { AttachmentFolderFilter } from "../attachment-folder/attachment-folder-filter";
import { AttachmentFolderManager } from "../attachment-folder/attachment-folder-manager";
import { AttachmentMoveDialog } from "./attachment-move-dialog";

/**
 * Thư viện tệp đính kèm: xem dạng lưới hoặc bảng danh sách toàn chiều ngang màn hình,
 * lọc theo từ khóa, loại tệp, định dạng, thư mục, người tạo và phạm vi, hỗ trợ thao tác hàng loạt.
 *
 * @param capabilities - Quyền giao diện từ view.
 * @returns Thư viện tệp.
 */
export function AttachmentLibrary(capabilities: AttachmentCapabilities) {
  const t = useTranslations("system.attachment");
  const tChoice = useTranslations("common.choice");
  const { viewMode, setViewMode } = useAttachmentViewMode();
  const state = useAttachmentLibrary(capabilities);
  const usersQuery = useAdminSessionUsers();
  const {
    table,
    query,
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
        {/* Hàng 1: Tìm kiếm + Select Sắp xếp + Toggle View Mode + Nút Làm mới */}
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
            <AttachmentViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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

        {/* Hàng 2: Bộ lọc (Loại tệp, Đuôi tệp, Thư mục, Quản lý thư mục, Người tạo, Phạm vi) + Xóa lọc */}
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

          {/* Lọc theo người tải lên (người tạo) khi có quyền xem tất cả */}
          {capabilities.canManageAll ? (
            <FilterSelect
              label={t("uploader")}
              value={table.getFilterValues("createdBy")}
              onValueChange={(values) => table.setFilterValues("createdBy", values)}
              searchable
              disabled={usersQuery.isPending}
              options={(usersQuery.data ?? []).map((user) => ({
                value: user.id,
                label:
                  [user.lastName, user.firstName].filter(Boolean).join(" ") ||
                  user.username ||
                  user.email,
                description: [user.email, user.username].filter(Boolean).join(" · "),
              }))}
            />
          ) : null}

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

        {/* Hàng 3: Thanh thao tác hàng loạt (Bulk Bar) chuẩn đơn dòng sang trọng */}
        {(capabilities.canDelete || capabilities.canMove) && state.selected.length > 0 ? (
          <div className="bg-primary/5 border-primary/20 animate-in fade-in-50 flex min-h-12 w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5 shadow-2xs duration-150 sm:flex-nowrap">
            <div className="flex shrink-0 items-center gap-2">
              <span className="bg-primary/10 text-primary border-primary/20 inline-flex h-8 items-center rounded-lg border px-2.5 text-xs font-semibold tabular-nums">
                {t("selectedCount", { count: state.selected.length, total: state.items.length })}
              </span>
              <div className="bg-border/60 h-4 w-px" aria-hidden />
              <Button
                variant="ghost"
                size="sm"
                disabled={state.locked}
                onClick={state.clearSelection}
                className="text-muted-foreground hover:text-foreground h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
              >
                <X className="size-3.5" />
                <span>{t("clearSelection")}</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={state.locked || state.selected.length === state.items.length}
                onClick={state.selectAll}
                className="h-8 rounded-lg px-3 text-xs font-medium"
              >
                {tChoice("selectAll")}
              </Button>
              {capabilities.canMove ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.locked}
                  onClick={() => state.setPendingMove(state.selected)}
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium"
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
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium"
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
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          aria-label={t("loading")}
          aria-busy="true"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : state.items.length ? (
        <div
          className="flex min-w-0 flex-col justify-between space-y-8 sm:space-y-10"
          aria-busy={query.isFetching}
        >
          <div className="min-h-[280px] sm:min-h-[340px]">
            <AttachmentGrid
              files={state.items}
              activeId={state.active?.id}
              selectedIds={state.selectedIds}
              viewMode={viewMode}
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

      {/* Dialog xem & thao tác chi tiết tệp chuẩn */}
      <AttachmentDetailDialog
        file={state.active}
        open={state.detailOpen && Boolean(state.active)}
        onClose={() => state.setDetailOpen(false)}
        onDelete={deleteOne}
        onMove={capabilities.canMove ? (file) => state.setPendingMove([file]) : undefined}
        onUpdated={(updated) => handleInspect(updated)}
        canEdit={Boolean(capabilities.canMove)}
        canDelete={capabilities.canDelete}
        disabled={state.locked}
      />

      <Dialog
        open={state.uploadOpen}
        onOpenChange={(open) => !open && !state.uploadBusy && state.setUploadOpen(false)}
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
