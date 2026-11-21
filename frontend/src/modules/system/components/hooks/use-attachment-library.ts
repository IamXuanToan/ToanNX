"use client";

import { useState } from "react";

import { useMediaQuery } from "@/shares/hooks/use-media-query";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { useAttachments } from "../../hooks/use-attachments";
import { useDeleteAttachments } from "../../hooks/use-delete-attachments";
import type { Attachment, AttachmentCapabilities } from "../../types/attachment.types";
import { MEDIA_KINDS, normalizeMediaFormats } from "../../constants/media-types";

/** @param capabilities - Các quyền do view truyền xuống. @returns Query, lựa chọn trong trang và thao tác thư viện. */
export function useAttachmentLibrary(capabilities: AttachmentCapabilities) {
  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["kind", "scope", "contentType", "folder", "createdBy"] as const,
  });
  const kinds = pickAllowedValues(table.getFilterValues("kind"), MEDIA_KINDS) ?? [];
  const formats = normalizeMediaFormats(kinds, table.getFilterValues("contentType"));
  const query = useAttachments({
    ...table.filters,
    kind: kinds,
    contentType: formats,
    folder: table.getFilterValues("folder"),
    createdBy: table.getFilterValues("createdBy"),
    scope: capabilities.canManageAll
      ? pickAllowedValues(table.getFilterValues("scope"), ["MINE", "OTHERS"])
      : undefined,
  });
  const items = query.data?.items ?? [];
  const wide = useMediaQuery("(min-width: 1024px)");
  const [activeId, setActiveId] = useState<string>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<Attachment | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Attachment[]>([]);
  const [pendingMove, setPendingMove] = useState<Attachment[]>([]);
  const remove = useDeleteAttachments();
  const selectionKey = JSON.stringify({ ...table.filters, ...table.extraFilters });
  const [selection, setSelection] = useState({ key: selectionKey, ids: [] as string[] });
  if (selection.key !== selectionKey) setSelection({ key: selectionKey, ids: [] });
  const selectedIds =
    selection.key === selectionKey
      ? selection.ids.filter((id) => items.some((file) => file.id === id))
      : [];
  const selected = items.filter((file) => selectedIds.includes(file.id));
  const active = items.find((file) => file.id === activeId) ?? items[0];
  const locked = remove.isPending || query.isPlaceholderData;
  const confirmDelete = () => {
    if (!pendingDelete.length || remove.isPending) return;
    const deleting = pendingDelete.map((file) => file.id);
    remove.mutate(deleting, {
      onSuccess: () => {
        setPendingDelete([]);
        setSelection({ key: selectionKey, ids: [] });
        setDetailOpen(false);
        if (table.filters.page > 1 && items.every((file) => deleting.includes(file.id)))
          table.onPageChange(table.filters.page - 1);
      },
    });
  };
  return {
    table,
    query,
    kinds,
    formats,
    pendingMove,
    setPendingMove,
    changeKinds: (values: string[]) => {
      table.setFilterValues("kind", values);
      table.setFilterValues("contentType", normalizeMediaFormats(values, formats));
    },
    items,
    active,
    detailOpen,
    setDetailOpen,
    uploadOpen,
    setUploadOpen,
    uploadBusy,
    setUploadBusy,
    pendingDelete,
    setPendingDelete,
    selectedIds,
    selected,
    locked,
    isDeleting: remove.isPending,
    confirmDelete,
    editingFile,
    setEditingFile,
    filtered: Boolean(table.keyword) || table.hasFilters,
    deleteOne: capabilities.canDelete ? (file: Attachment) => setPendingDelete([file]) : undefined,
    inspect: (file: Attachment) => {
      setActiveId(file.id);
      setDetailOpen(true);
    },
    toggle: (id: string, checked: boolean) =>
      setSelection({
        key: selectionKey,
        ids: checked
          ? [...new Set([...selectedIds, id])]
          : selectedIds.filter((value) => value !== id),
      }),
    selectAll: () => setSelection({ key: selectionKey, ids: items.map((file) => file.id) }),
    clearSelection: () => setSelection({ key: selectionKey, ids: [] }),
    uploaded: (file: Attachment) => {
      setActiveId(file.id);
      table.clearFilters();
    },
  };
}
