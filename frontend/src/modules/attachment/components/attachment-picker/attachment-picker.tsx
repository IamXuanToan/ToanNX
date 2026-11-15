"use client";

import { Images, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataPagination } from "@/shares/components/common/data-pagination/data-pagination";
import { EmptyState } from "@/shares/components/common/empty-state/empty-state";
import { SearchInput } from "@/shares/components/common/search-input/search-input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import type { Attachment, FolderCapabilities } from "../../types/attachment.types";
import { AttachmentMediaFilters } from "../attachment-media-filters/attachment-media-filters";
import { AttachmentFolderFilter } from "../attachment-folder-filter/attachment-folder-filter";
import { AttachmentFolderManager } from "../attachment-folder-manager/attachment-folder-manager";
import { AttachmentDetails } from "../attachment-details/attachment-details";
import { AttachmentGrid } from "../attachment-grid/attachment-grid";
import { AttachmentUpload } from "../attachment-upload/attachment-upload";
import { useAttachmentPicker } from "./hooks/use-attachment-picker";

/** @param props - Quyền thư viện/upload và callback chọn ảnh. @returns Bộ chọn ảnh một mục, hai tab dùng chung kho file. */
export function AttachmentPicker({
  canRead,
  canUpload,
  folders,
  onSelect,
  onClose,
}: {
  canRead: boolean;
  canUpload: boolean;
  folders?: FolderCapabilities;
  onSelect: (file: Attachment) => void;
  onClose: () => void;
}) {
  const t = useTranslations("attachment");
  const state = useAttachmentPicker(canRead);
  const { query } = state;
  return (
    <Dialog open onOpenChange={(open) => !open && !state.busy && onClose()}>
      <DialogContent
        showCloseButton={!state.busy}
        className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[100rem]"
      >
        <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
          <DialogTitle>{t("pickerTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("chooseImage")}</DialogDescription>
        </DialogHeader>
        <Tabs
          value={state.tab}
          onValueChange={(value) => !state.busy && state.setTab(value)}
          className="min-h-0 flex-1 gap-0 overflow-y-auto"
        >
          <div className="border-b px-4 py-2 sm:px-6">
            <TabsList variant="line" className="h-12">
              {canRead ? (
                <TabsTrigger value="library" disabled={state.busy} className="h-10 rounded-xl">
                  {t("libraryTab")}
                </TabsTrigger>
              ) : null}
              {canUpload ? (
                <TabsTrigger value="upload" disabled={state.busy} className="h-10 rounded-xl">
                  {t("uploadTab")}
                </TabsTrigger>
              ) : null}
            </TabsList>
          </div>
          {canRead ? (
            <TabsContent value="library" className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <SearchInput
                  value={state.search}
                  onValueChange={state.applySearch}
                  placeholder={t("search")}
                  className="min-w-0 flex-1 sm:max-w-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={query.isFetching}
                  onClick={() => query.refetch()}
                  aria-label={t("reload")}
                >
                  <RotateCw />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AttachmentMediaFilters
                  kinds={state.kinds}
                  formats={state.formats}
                  onKindsChange={state.changeKinds}
                  onFormatsChange={state.changeFormats}
                  disabled={state.busy}
                />
                <AttachmentFolderFilter
                  canRead={Boolean(folders?.canRead)}
                  value={state.folders}
                  onChange={state.changeFolders}
                  disabled={state.busy}
                />
                <AttachmentFolderManager capabilities={folders} disabled={state.busy} />
                {state.search ||
                state.formats.length ||
                state.folders.length ||
                state.kinds.length !== 1 ||
                state.kinds[0] !== "IMAGE" ? (
                  <Button variant="ghost" onClick={state.clearFilters} disabled={state.busy}>
                    {t("clearFilters")}
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-4">
                  {query.isPending ? (
                    <div
                      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-3"
                      aria-busy="true"
                      aria-label={t("loading")}
                    >
                      {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-52 rounded-xl" />
                      ))}
                    </div>
                  ) : query.isError ? (
                    <ErrorState onRetry={() => query.refetch()} />
                  ) : query.data.items.length ? (
                    <AttachmentGrid
                      files={query.data.items}
                      activeId={state.selected?.id}
                      onInspect={state.setSelected}
                      disabled={state.busy || query.isPlaceholderData}
                    />
                  ) : (
                    <EmptyState
                      title={
                        state.search ||
                        state.formats.length ||
                        state.folders.length ||
                        state.kinds.length
                          ? t("noResults")
                          : t("empty")
                      }
                      icon={<Images />}
                      action={
                        state.search || state.formats.length || state.folders.length ? (
                          <Button variant="outline" onClick={state.clearFilters}>
                            {t("clearFilters")}
                          </Button>
                        ) : canUpload ? (
                          <Button onClick={() => state.setTab("upload")}>{t("upload")}</Button>
                        ) : undefined
                      }
                    />
                  )}
                  {query.data?.items.length ? (
                    <div className="rounded-xl border p-3">
                      <DataPagination
                        pagination={query.data.pagination}
                        onPageChange={state.setPage}
                        disabled={state.busy || query.isPlaceholderData}
                      />
                    </div>
                  ) : null}
                </div>
                <aside className="hidden min-w-0 lg:block">
                  {state.selected ? (
                    <AttachmentDetails file={state.selected} />
                  ) : (
                    <p className="text-muted-foreground p-4 text-sm">{t("selectPrompt")}</p>
                  )}
                </aside>
              </div>
            </TabsContent>
          ) : null}
          {canUpload ? (
            <TabsContent value="upload" className="p-4 sm:p-6">
              <AttachmentUpload
                folders={folders}
                imageOnly
                multiple={false}
                onUploaded={state.uploaded}
                onBusyChange={state.setBusy}
              />
            </TabsContent>
          ) : null}
        </Tabs>
        <div className="bg-card flex shrink-0 items-center justify-between gap-3 border-t p-4 sm:px-6">
          <span className="text-muted-foreground text-xs sm:text-sm">
            {state.selected && !state.selected.contentType.startsWith("image/")
              ? t("incompatibleSelection")
              : state.selected
                ? t("selectedImage")
                : t("noImage")}
          </span>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" disabled={state.busy} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              disabled={
                !state.selected || !state.selected.contentType.startsWith("image/") || state.busy
              }
              onClick={() => state.selected && onSelect(state.selected)}
            >
              {t("useImage")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
