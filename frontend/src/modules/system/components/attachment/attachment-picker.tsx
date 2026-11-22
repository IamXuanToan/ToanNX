"use client";

import { cn } from "cn";
import {
  CloudUpload,
  Eye,
  FolderInput,
  Images,
  Loader2,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { DataPagination } from "@/shares/components/common/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state";
import { SearchInput } from "@/shares/components/common/search-input";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { usePermission } from "@/modules/system/hooks/use-permission";

import { formatAttachmentSize } from "../../services/attachment.service";
import type { Attachment, AttachmentVisibility } from "../../types/attachment.types";
import type { FolderCapabilities } from "../../types/attachment-folder.types";
import { type MediaKind, acceptAttributeFor } from "../../constants/media-types";
import { ATTACHMENT_PERMISSIONS } from "../../permissions/attachment-permission";
import { ATTACHMENT_FOLDER_PERMISSIONS } from "../../permissions/attachment-folder-permission";
import { AttachmentMediaFilters } from "./attachment-media-filters";
import { AttachmentFolderFilter } from "../attachment-folder/attachment-folder-filter";
import { AttachmentFolderManager } from "../attachment-folder/attachment-folder-manager";
import { AttachmentDetailDialog } from "./attachment-detail-dialog";
import { AttachmentGrid } from "./attachment-grid";
import { AttachmentPreview } from "./attachment-preview";
import { AttachmentMoveDialog } from "./attachment-move-dialog";
import { AttachmentViewModeToggle } from "./attachment-view-mode-toggle";
import { AttachmentVisibilityToggle } from "./attachment-visibility-toggle";
import { useAttachmentViewMode } from "./hooks/use-attachment-view-mode";
import { useAttachmentPicker } from "./hooks/use-attachment-picker";

/**
 * Bộ chọn và tải file dùng chung cho toàn bộ hệ thống. Mặc định giữ hành vi cũ: chọn một ảnh công khai.
 *
 * @param props - Quyền tải lên/thư mục, callback chọn và cấu hình nơi dùng:
 *   - `accept`: loại file nhận (mặc định `["IMAGE"]`);
 *   - `visibility` + `lockVisibility`: chế độ xem của file tải lên mới (màn Chứng từ: `"private"` + khóa);
 *   - `visibilityFilter`: chỉ liệt kê file một chế độ; mặc định chế độ đang khóa, không khóa thì `"public"`
 *     (avatar, ảnh bìa, logo QR không chọn nhầm file riêng tư); `"all"` để liệt kê cả hai;
 *   - `multiple` + `onSelectMany`: chọn nhiều file.
 * @returns Dialog chọn file trực quan, hỗ trợ kéo thả và tải file trực tiếp từ thiết bị.
 */
export function AttachmentPicker({
  canUpload,
  folders,
  canDelete: canDeleteProp,
  canMove: canMoveProp,
  accept = ["IMAGE"],
  visibility = "public",
  lockVisibility = false,
  visibilityFilter,
  multiple = false,
  onSelect,
  onSelectMany,
  onClose,
}: {
  canUpload: boolean;
  folders?: FolderCapabilities;
  canDelete?: boolean;
  canMove?: boolean;
  accept?: readonly MediaKind[];
  visibility?: AttachmentVisibility;
  lockVisibility?: boolean;
  visibilityFilter?: AttachmentVisibility | "all";
  multiple?: boolean;
  onSelect: (file: Attachment) => void;
  onSelectMany?: (files: Attachment[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("system.attachment");
  const tChoice = useTranslations("common.choice");
  const { viewMode, setViewMode } = useAttachmentViewMode();
  const listVisibility = visibilityFilter ?? (lockVisibility ? visibility : "public");
  const state = useAttachmentPicker({
    accept,
    visibility,
    lockVisibility,
    visibilityFilter: listVisibility === "all" ? undefined : listVisibility,
  });
  const imageOnly = accept.length === 1 && accept[0] === "IMAGE";
  const selectedFiles = (state.query.data?.items ?? []).filter((item) =>
    state.selectedIds.includes(item.id),
  );
  const {
    query,
    fileInputRef,
    isDragging,
    setIsDragging,
    detailFile,
    setDetailFile,
    hasActiveFilters,
  } = state;

  const hasDeletePermission = usePermission(ATTACHMENT_PERMISSIONS.delete);
  const hasUpdatePermission = usePermission(ATTACHMENT_PERMISSIONS.update);
  const canDelete = canDeleteProp ?? hasDeletePermission;
  const canMove = canMoveProp ?? hasUpdatePermission;

  const defaultCanFolderRead = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderRead);
  const defaultCanFolderCreate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderCreate);
  const defaultCanFolderUpdate = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderUpdate);
  const defaultCanFolderDelete = usePermission(ATTACHMENT_FOLDER_PERMISSIONS.folderDelete);

  const effectiveFolders: FolderCapabilities = {
    canRead: folders?.canRead ?? defaultCanFolderRead,
    canCreate: folders?.canCreate ?? defaultCanFolderCreate,
    canUpdate: folders?.canUpdate ?? defaultCanFolderUpdate,
    canDelete: folders?.canDelete ?? defaultCanFolderDelete,
    canDeleteFiles: folders?.canDeleteFiles ?? canDelete,
  };

  const handleConfirmImage = (file: Attachment) => {
    if (state.isAccepted(file)) {
      onSelect(file);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden border-none p-0 sm:h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100vw-2.5rem)] sm:max-w-7xl sm:rounded-2xl sm:border xl:max-w-[1400px]">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3 pr-8 sm:pr-0">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold sm:text-lg">
                {imageOnly ? t("pickerTitle") : t("pickerTitleFile")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-0.5 line-clamp-1 text-xs sm:text-sm">
                {imageOnly ? t("pickerUploadHint") : t("pickerUploadHintFile")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptAttributeFor(accept)}
          className="sr-only"
          aria-label={t("upload")}
          disabled={state.isUploading || !canUpload}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) void state.upload(files);
          }}
        />

        {/* Toolbar & Filter Bar */}
        <div className="bg-muted/20 shrink-0 space-y-2.5 border-b px-4 py-2.5 sm:px-6 sm:py-3">
          {/* Hàng 1: Tìm kiếm + Toggle View Mode + Reload + Nút Tải lên */}
          <div className="flex items-center gap-2">
            <SearchInput
              value={state.search}
              onValueChange={state.applySearch}
              placeholder={t("search")}
              className="h-10 min-w-0 flex-1 rounded-xl"
            />
            <AttachmentViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              disabled={query.isFetching}
              onClick={() => query.refetch()}
              aria-label={t("reload")}
              title={t("reload")}
            >
              <RotateCw className={cn("size-4", query.isFetching && "animate-spin")} />
            </Button>
            {canUpload ? (
              <Button
                type="button"
                variant="default"
                className="h-10 shrink-0 gap-1.5 rounded-xl px-3 font-medium shadow-xs sm:gap-2 sm:px-4"
                disabled={state.isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {state.isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span className="hidden sm:inline">{t("upload")}</span>
                <span className="sm:hidden">{t("uploadShort")}</span>
              </Button>
            ) : null}
          </div>

          {canUpload && (lockVisibility || listVisibility === "all") ? (
            <AttachmentVisibilityToggle
              value={state.uploadVisibility}
              onChange={state.setUploadVisibility}
              locked={lockVisibility}
              disabled={state.isUploading}
            />
          ) : null}

          {/* Hàng 2: Bộ lọc (cuộn ngang mượt mà trên mobile) */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 text-xs sm:text-sm">
            <AttachmentFolderFilter
              canRead={effectiveFolders.canRead}
              value={state.folders}
              onChange={state.changeFolders}
              scope={["MINE"]}
            />
            <AttachmentFolderManager capabilities={effectiveFolders} />
            <AttachmentMediaFilters
              kinds={state.kinds}
              formats={state.formats}
              onKindsChange={state.changeKinds}
              onFormatsChange={state.changeFormats}
            />
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={state.clearFilters}
                className="text-muted-foreground hover:text-foreground h-8 shrink-0 rounded-lg px-2.5 text-xs"
              >
                <X className="mr-1 size-3.5" />
                {t("clearFiltersShort")}
              </Button>
            ) : null}
          </div>

          {/* Hàng 3: Thanh thao tác chọn nhiều (Bulk Bar: Chuyển thư mục & Xóa) */}
          {(canDelete || canMove || multiple) && state.selectedIds.length > 0 ? (
            <div className="bg-primary/5 border-primary/20 animate-in fade-in-50 flex min-h-12 w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5 shadow-2xs duration-150 sm:flex-nowrap">
              <div className="flex shrink-0 items-center gap-2">
                <span className="bg-primary/10 text-primary border-primary/20 inline-flex h-8 items-center rounded-lg border px-2.5 text-xs font-semibold tabular-nums">
                  {t("selectedCount", {
                    count: state.selectedIds.length,
                    total: query.data?.items.length ?? 0,
                  })}
                </span>
                <div className="bg-border/60 h-4 w-px" aria-hidden />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={state.clearSelection}
                  className="text-muted-foreground hover:text-foreground h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                >
                  <X className="size-3.5" />
                  <span>{t("clearSelection")}</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={state.selectAll}
                  disabled={state.selectedIds.length === (query.data?.items.length ?? 0)}
                  className="h-8 rounded-lg px-3 text-xs font-medium"
                >
                  {tChoice("selectAll")}
                </Button>
                {canMove ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => state.setPendingMoveFiles(selectedFiles)}
                    className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium"
                    data-testid="picker-bulk-move-button"
                  >
                    <FolderInput className="size-3.5" />
                    <span>{t("moveFiles")}</span>
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => state.setPendingBulkDelete(true)}
                    className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium"
                    data-testid="picker-bulk-delete-button"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{t("deleteSelected", { count: state.selectedIds.length })}</span>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Nội dung chính: Lưới ảnh toàn chiều rộng (Spacious & Clean) */}
        <div
          className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
          onDragOver={(event) => {
            if (!canUpload) return;
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDragging(false);
          }}
          onDrop={(event) => {
            if (!canUpload) return;
            event.preventDefault();
            setIsDragging(false);
            const files = Array.from(event.dataTransfer.files ?? []);
            if (files.length) void state.upload(files);
          }}
        >
          {/* Overlay kéo thả ảnh */}
          {isDragging ? (
            <div className="border-primary bg-background/90 animate-in fade-in-50 absolute inset-3 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center backdrop-blur-xs duration-150">
              <div className="bg-primary/10 text-primary mb-3 animate-bounce rounded-full p-4">
                <CloudUpload className="size-8" />
              </div>
              <p className="text-foreground text-base font-semibold">
                {imageOnly ? t("dropImageHere") : t("dropFileHere")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{t("dropHint")}</p>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col justify-between space-y-6 sm:space-y-8">
            {/* Thẻ hiển thị khi đang tải ảnh lên */}
            {state.isUploading ? (
              <Card className="border-primary/30 bg-primary/5 flex animate-pulse items-center gap-3 rounded-xl p-3.5 shadow-none">
                <Loader2 className="text-primary size-5 shrink-0 animate-spin" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-medium sm:text-sm">
                    {state.uploadProgressName ?? t("uploadingHint")}
                  </p>
                  <p className="text-muted-foreground text-[11px]">{t("uploading")}</p>
                </div>
              </Card>
            ) : null}

            <div className="min-h-[280px] sm:min-h-[340px]">
              {query.isPending ? (
                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  aria-busy="true"
                  aria-label={t("loading")}
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <Skeleton key={index} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : query.isError ? (
                <ErrorState onRetry={() => query.refetch()} />
              ) : query.data.items.length ? (
                <AttachmentGrid
                  files={query.data.items}
                  activeId={state.selected?.id}
                  selectedIds={state.selectedIds}
                  viewMode={viewMode}
                  onInspect={state.setSelected}
                  onToggle={canDelete || canMove || multiple ? state.toggleSelect : undefined}
                  onConfirm={handleConfirmImage}
                  onViewDetails={(file) => setDetailFile(file)}
                  disabled={query.isPlaceholderData}
                  className={
                    viewMode === "grid"
                      ? "grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                      : undefined
                  }
                />
              ) : (
                <EmptyState
                  title={hasActiveFilters ? t("noResults") : t("empty")}
                  description={hasActiveFilters ? undefined : t("emptyDescription")}
                  icon={<Images />}
                  action={
                    hasActiveFilters ? (
                      <Button
                        variant="outline"
                        onClick={state.clearFilters}
                        className="h-10 rounded-xl"
                      >
                        {t("clearFilters")}
                      </Button>
                    ) : canUpload ? (
                      <Button
                        variant="default"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 gap-2 rounded-xl"
                      >
                        <Upload className="size-4" />
                        {t("upload")}
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </div>

            {query.data?.items.length ? (
              <Card className="bg-card mt-auto rounded-xl p-2.5 shadow-none sm:p-3">
                <DataPagination
                  pagination={query.data.pagination}
                  onPageChange={state.setPage}
                  disabled={query.isPlaceholderData}
                />
              </Card>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card flex shrink-0 items-center justify-between gap-3 border-t p-3 sm:px-6 sm:py-3.5">
          {state.selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg border">
                <AttachmentPreview file={state.selected} className="size-full" />
              </div>
              <div className="min-w-0 pr-1">
                <p
                  className="max-w-[120px] truncate text-xs font-medium sm:max-w-xs sm:text-sm"
                  title={state.selected.originalName}
                >
                  {state.selected.originalName}
                </p>
                <p className="text-muted-foreground text-[11px] tabular-nums">
                  {formatAttachmentSize(state.selected.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDetailFile(state.selected)}
                className="text-muted-foreground hover:text-foreground h-8 gap-1 rounded-lg px-2 text-xs"
                title={t("viewDetails")}
              >
                <Eye className="size-3.5" />
                <span className="hidden md:inline">{t("viewDetails")}</span>
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs sm:text-sm">
              {imageOnly ? t("noImage") : t("noFile")}
            </span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={onClose} className="h-10 rounded-xl px-4">
              {t("cancel")}
            </Button>
            {multiple && onSelectMany ? (
              <Button
                disabled={!selectedFiles.some(state.isAccepted)}
                onClick={() => onSelectMany(selectedFiles.filter(state.isAccepted))}
                className="h-10 rounded-xl px-4 font-medium shadow-xs sm:px-5"
              >
                {t("useFiles", { count: selectedFiles.filter(state.isAccepted).length })}
              </Button>
            ) : (
              <Button
                disabled={!state.selected || !state.isAccepted(state.selected)}
                onClick={() => state.selected && onSelect(state.selected)}
                className="h-10 rounded-xl px-4 font-medium shadow-xs sm:px-5"
              >
                {imageOnly ? t("useImage") : t("useFile")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {state.pendingMoveFiles.length > 0 ? (
        <AttachmentMoveDialog
          files={state.pendingMoveFiles}
          canReadFolders={effectiveFolders.canRead}
          onClose={() => state.setPendingMoveFiles([])}
          onDone={state.handleMoveDone}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(state.pendingDelete)}
        onOpenChange={(open) => !open && state.setPendingDelete(null)}
        title={t("deleteTitle", { count: 1 })}
        description={t("deleteDescription")}
        confirmLabel={t("deleteSelected", { count: 1 })}
        onConfirm={state.confirmDelete}
        isPending={state.isDeleting}
      />

      <ConfirmDialog
        open={state.pendingBulkDelete}
        onOpenChange={(open) => !open && state.setPendingBulkDelete(false)}
        title={t("deleteTitle", { count: state.selectedIds.length })}
        description={t("deleteDescription")}
        confirmLabel={t("deleteSelected", { count: state.selectedIds.length })}
        onConfirm={state.confirmBulkDelete}
        isPending={state.isDeleting}
      />

      {/* Dialog Chi tiết tệp (Tách riêng, rộng rãi, hỗ trợ inline edit và nút Chọn ảnh) */}
      <AttachmentDetailDialog
        file={detailFile}
        open={Boolean(detailFile)}
        onClose={() => setDetailFile(null)}
        onSelect={(file) => {
          state.setSelected(file);
          setDetailFile(null);
          handleConfirmImage(file);
        }}
        onDelete={canDelete ? (file) => state.setPendingDelete(file) : undefined}
        onMove={canMove ? (file) => state.setPendingMoveFiles([file]) : undefined}
        onUpdated={(updated) => {
          state.setSelected(updated);
          setDetailFile(updated);
        }}
        canEdit={canMove}
        canDelete={canDelete}
        disabled={state.isDeleting}
        isSelectable={state.isAccepted}
        selectLabel={imageOnly ? t("useImage") : t("useFile")}
      />
    </Dialog>
  );
}
