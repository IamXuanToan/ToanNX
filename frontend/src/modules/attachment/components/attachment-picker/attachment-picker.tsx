"use client";

import { ExternalLink, Images, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
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

import type { Attachment } from "../../types/attachment.types";
import type { FolderCapabilities } from "../../types/attachment-folder.types";
import { ATTACHMENT_ROUTES } from "../../constants/routes";
import { AttachmentMediaFilters } from "../attachment-media-filters/attachment-media-filters";
import { AttachmentFolderFilter } from "../attachment-folder-filter/attachment-folder-filter";
import { AttachmentFolderManager } from "../attachment-folder-manager/attachment-folder-manager";
import { AttachmentDetails } from "../attachment-details/attachment-details";
import { AttachmentGrid } from "../attachment-grid/attachment-grid";
import { useAttachmentPicker } from "./hooks/use-attachment-picker";

/** @param props - Quyền mở Thư viện và callback chọn ảnh. @returns Bộ chọn ảnh có sẵn trong Thư viện. */
export function AttachmentPicker({
  canUpload,
  folders,
  onSelect,
  onClose,
}: {
  canUpload: boolean;
  folders?: FolderCapabilities;
  onSelect: (file: Attachment) => void;
  onClose: () => void;
}) {
  const t = useTranslations("attachment");
  const state = useAttachmentPicker();
  const { query } = state;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[100rem]">
        <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
          <DialogTitle>{t("pickerTitle")}</DialogTitle>
          <DialogDescription>
            {canUpload ? t("pickerUploadHint") : t("chooseImage")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={state.search}
              onValueChange={state.applySearch}
              placeholder={t("search")}
              className="min-w-48 flex-1 sm:max-w-none"
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
            {canUpload ? (
              <Button asChild variant="outline">
                <Link href={ATTACHMENT_ROUTES.library} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  {t("openLibrary")}
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AttachmentMediaFilters
              kinds={state.kinds}
              formats={state.formats}
              onKindsChange={state.changeKinds}
              onFormatsChange={state.changeFormats}
            />
            <AttachmentFolderFilter
              canRead={Boolean(folders?.canRead)}
              value={state.folders}
              onChange={state.changeFolders}
            />
            <AttachmentFolderManager capabilities={folders} />
            {state.search ||
            state.formats.length ||
            state.folders.length ||
            state.kinds.length !== 1 ||
            state.kinds[0] !== "IMAGE" ? (
              <Button variant="ghost" onClick={state.clearFilters}>
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
                  disabled={query.isPlaceholderData}
                />
              ) : (
                <EmptyState
                  title={
                    state.search ||
                    state.formats.length ||
                    state.folders.length ||
                    state.kinds.length !== 1 ||
                    state.kinds[0] !== "IMAGE"
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
                      <Button asChild variant="outline">
                        <Link
                          href={ATTACHMENT_ROUTES.library}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink />
                          {t("openLibrary")}
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              )}
              {query.data?.items.length ? (
                <div className="rounded-xl border p-3">
                  <DataPagination
                    pagination={query.data.pagination}
                    onPageChange={state.setPage}
                    disabled={query.isPlaceholderData}
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
        </div>
        <div className="bg-card flex shrink-0 items-center justify-between gap-3 border-t p-4 sm:px-6">
          <span className="text-muted-foreground text-xs sm:text-sm">
            {state.selected && !state.selected.contentType.startsWith("image/")
              ? t("incompatibleSelection")
              : state.selected
                ? t("selectedImage")
                : t("noImage")}
          </span>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!state.selected || !state.selected.contentType.startsWith("image/")}
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
