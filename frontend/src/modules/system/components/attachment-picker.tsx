"use client";

import Image from "next/image";
import { cn } from "cn";
import { CloudUpload, Eye, Images, Loader2, RotateCw, Upload, X } from "lucide-react";
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

import { formatAttachmentSize } from "../services/attachment.service";
import type { Attachment } from "../types/attachment.types";
import type { FolderCapabilities } from "../types/attachment-folder.types";
import { ATTACHMENT_PERMISSIONS } from "../permissions/attachment-permission";
import { AttachmentMediaFilters } from "./attachment-media-filters";
import { AttachmentFolderFilter } from "./attachment-folder-filter";
import { AttachmentFolderManager } from "./attachment-folder-manager";
import { AttachmentDetailDialog } from "./attachment-detail-dialog";
import { AttachmentGrid } from "./attachment-grid";
import { AttachmentMoveDialog } from "./attachment-move-dialog";
import { useAttachmentPicker } from "./hooks/use-attachment-picker";

/**
 * Bộ chọn và tải ảnh dùng chung cho toàn bộ hệ thống.
 *
 * @param props - Quyền tải lên, quyền thư mục và callback chọn ảnh.
 * @returns Dialog chọn ảnh trực quan, hỗ trợ kéo thả và tải ảnh trực tiếp từ thiết bị.
 */
export function AttachmentPicker({
  canUpload,
  folders,
  canDelete: canDeleteProp,
  canMove: canMoveProp,
  onSelect,
  onClose,
}: {
  canUpload: boolean;
  folders?: FolderCapabilities;
  canDelete?: boolean;
  canMove?: boolean;
  onSelect: (file: Attachment) => void;
  onClose: () => void;
}) {
  const t = useTranslations("system.attachment");
  const state = useAttachmentPicker();
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

  const handleConfirmImage = (file: Attachment) => {
    if (file.contentType.startsWith("image/")) {
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
                {t("pickerTitle")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-0.5 line-clamp-1 text-xs sm:text-sm">
                {t("pickerUploadHint")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
          {/* Hàng 1: Tìm kiếm + Reload + Nút Tải lên */}
          <div className="flex items-center gap-2">
            <SearchInput
              value={state.search}
              onValueChange={state.applySearch}
              placeholder={t("search")}
              className="h-10 min-w-0 flex-1 rounded-xl"
            />
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

          {/* Hàng 2: Bộ lọc (cuộn ngang mượt mà trên mobile) */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 text-xs sm:text-sm">
            <AttachmentFolderFilter
              canRead={Boolean(folders?.canRead)}
              value={state.folders}
              onChange={state.changeFolders}
              scope={["MINE"]}
            />
            <AttachmentMediaFilters
              kinds={state.kinds}
              formats={state.formats}
              onKindsChange={state.changeKinds}
              onFormatsChange={state.changeFormats}
            />
            <AttachmentFolderManager capabilities={folders} />
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
              <p className="text-foreground text-base font-semibold">{t("dropImageHere")}</p>
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
                  onInspect={state.setSelected}
                  onConfirm={handleConfirmImage}
                  onViewDetails={(file) => setDetailFile(file)}
                  disabled={query.isPlaceholderData}
                  className="grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
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
                <Image
                  src={state.selected.url}
                  alt={state.selected.altText || state.selected.originalName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
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
            <span className="text-muted-foreground text-xs sm:text-sm">{t("noImage")}</span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={onClose} className="h-10 rounded-xl px-4">
              {t("cancel")}
            </Button>
            <Button
              disabled={!state.selected || !state.selected.contentType.startsWith("image/")}
              onClick={() => state.selected && onSelect(state.selected)}
              className="h-10 rounded-xl px-4 font-medium shadow-xs sm:px-5"
            >
              {t("useImage")}
            </Button>
          </div>
        </div>
      </DialogContent>

      {state.pendingMove ? (
        <AttachmentMoveDialog
          files={[state.pendingMove]}
          canReadFolders={Boolean(folders?.canRead)}
          onClose={() => state.setPendingMove(null)}
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
        onUpdated={(updated) => {
          state.setSelected(updated);
          setDetailFile(updated);
        }}
        canEdit={canMove}
        canDelete={canDelete}
        disabled={state.isDeleting}
      />
    </Dialog>
  );
}
