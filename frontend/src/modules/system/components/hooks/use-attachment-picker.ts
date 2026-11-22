"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useAttachments } from "../../hooks/use-attachments";
import { useDeleteAttachments } from "../../hooks/use-delete-attachments";
import { useUploadAttachment } from "../../hooks/use-upload-attachment";
import type { Attachment, AttachmentVisibility } from "../../types/attachment.types";
import {
  type MediaKind,
  UNFILED_FOLDER,
  isAcceptedKind,
  normalizeMediaFormats,
} from "../../constants/media-types";

const PICKER_PAGE_SIZE = 12;

/**
 * @param options - Loại file nhận, chế độ xem của file tải lên mới và bộ lọc chế độ xem của danh sách.
 * @returns State chọn file trong Thư viện, hỗ trợ tải lên trực tiếp và chọn ngay tệp vừa tải.
 */
export function useAttachmentPicker({
  accept,
  visibility,
  lockVisibility,
  visibilityFilter,
}: {
  accept: readonly MediaKind[];
  visibility: AttachmentVisibility;
  lockVisibility: boolean;
  visibilityFilter?: AttachmentVisibility;
}) {
  const t = useTranslations("system.attachment");
  const errorMessage = useApiErrorMessage();
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachments();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [kinds, setKinds] = useState<string[]>([...accept]);
  const [chosenVisibility, setUploadVisibility] = useState<AttachmentVisibility>(visibility);
  // Nơi dùng khóa chế độ thì luôn theo props; danh sách có lọc thì file mới phải cùng chế độ để hiện ra.
  const uploadVisibility = lockVisibility ? visibility : (visibilityFilter ?? chosenVisibility);
  const [formats, setFormats] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressName, setUploadProgressName] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);
  const [pendingMoveFiles, setPendingMoveFiles] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [detailFile, setDetailFile] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = useAttachments({
    search,
    page,
    pageSize: PICKER_PAGE_SIZE,
    ordering: "-created_at",
    kind: kinds,
    contentType: formats,
    folder: folders,
    scope: ["MINE"],
    visibility: visibilityFilter ? [visibilityFilter] : undefined,
  });

  // Bỏ lựa chọn đã bị xóa qua quản lý thư mục hoặc không còn trong trang hiện tại.
  if (
    selected &&
    !isUploading &&
    query.isSuccess &&
    !query.isFetching &&
    !query.isPlaceholderData &&
    !query.data.items.some((file) => file.id === selected.id)
  ) {
    setSelected(null);
  }

  const upload = async (files: File[]): Promise<Attachment | null> => {
    if (!files.length || isUploading) return null;
    const file = files[0];
    setIsUploading(true);
    setUploadProgressName(file.name);
    try {
      const activeFolder =
        folders.length === 1 && folders[0] !== UNFILED_FOLDER ? folders[0] : null;
      const uploaded = await uploadMutation.mutateAsync({
        file,
        folderId: activeFolder,
        visibility: uploadVisibility,
      });

      if (!isAcceptedKind(uploaded.contentType, accept)) {
        toast.error(
          accept.length === 1 && accept[0] === "IMAGE" ? t("imageOnly") : t("fileNotAccepted"),
        );
        return null;
      }

      setSelected(uploaded);
      setPage(1);
      await query.refetch();
      toast.success(t("uploaded"));
      return uploaded;
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgressName(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete || deleteMutation.isPending) return;
    const deletingId = pendingDelete.id;
    deleteMutation.mutate([deletingId], {
      onSuccess: () => {
        setPendingDelete(null);
        if (selected?.id === deletingId) {
          setSelected(null);
        }
        setSelectedIds((current) => current.filter((id) => id !== deletingId));
        if (page > 1 && query.data?.items.length === 1) {
          setPage(page - 1);
        }
        void query.refetch();
      },
    });
  };

  const toggleSelect = (id: string, isChecked: boolean) => {
    setSelectedIds((current) =>
      isChecked ? [...current, id] : current.filter((item) => item !== id),
    );
  };

  const selectAll = () => {
    const pageIds = query.data?.items.map((file) => file.id) ?? [];
    setSelectedIds(pageIds);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const confirmBulkDelete = () => {
    if (!selectedIds.length || deleteMutation.isPending) return;
    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        const deletedSet = new Set(selectedIds);
        if (selected && deletedSet.has(selected.id)) {
          setSelected(null);
        }
        setSelectedIds([]);
        setPendingBulkDelete(false);
        void query.refetch();
      },
    });
  };

  const handleMoveDone = () => {
    setPendingMoveFiles([]);
    setSelectedIds([]);
    void query.refetch();
  };

  return {
    search,
    page,
    setPage: (newPage: number) => {
      setPage(newPage);
      setSelectedIds([]);
    },
    selected,
    setSelected,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    pendingBulkDelete,
    setPendingBulkDelete,
    confirmBulkDelete,
    query,
    kinds,
    formats,
    folders,
    isUploading,
    uploadProgressName,
    upload,
    pendingDelete,
    setPendingDelete,
    isDeleting: deleteMutation.isPending,
    confirmDelete,
    pendingMoveFiles,
    setPendingMoveFiles,
    handleMoveDone,
    changeKinds: (values: string[]) => {
      setKinds(values);
      setFormats((current) => normalizeMediaFormats(values, current));
      setPage(1);
      setSelected(null);
      setSelectedIds([]);
    },
    changeFormats: (values: string[]) => {
      setFormats(values);
      setPage(1);
      setSelected(null);
      setSelectedIds([]);
    },
    changeFolders: (values: string[]) => {
      setFolders(values);
      setPage(1);
      setSelected(null);
      setSelectedIds([]);
    },
    clearFilters: () => {
      setSearch("");
      setKinds([...accept]);
      setFormats([]);
      setFolders([]);
      setPage(1);
      setSelected(null);
      setSelectedIds([]);
    },
    applySearch: (value: string) => {
      setSearch(value);
      setPage(1);
      setSelected(null);
      setSelectedIds([]);
    },
    isDragging,
    setIsDragging,
    detailFile,
    setDetailFile,
    fileInputRef,
    triggerFileInput: () => fileInputRef.current?.click(),
    hasActiveFilters: Boolean(
      search ||
      formats.length ||
      folders.length ||
      kinds.length !== accept.length ||
      kinds.some((kind) => !accept.includes(kind as MediaKind)),
    ),
    uploadVisibility,
    setUploadVisibility,
    isAccepted: (file: Attachment) => isAcceptedKind(file.contentType, accept),
  };
}
