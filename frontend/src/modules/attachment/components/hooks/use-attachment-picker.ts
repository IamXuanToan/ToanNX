"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useAttachments } from "../../hooks/use-attachments";
import { useDeleteAttachments } from "../../hooks/use-delete-attachments";
import { useUploadAttachment } from "../../hooks/use-upload-attachment";
import type { Attachment } from "../../types/attachment.types";
import { UNFILED_FOLDER, normalizeMediaFormats } from "../../constants/media-types";

const PICKER_PAGE_SIZE = 12;

/** @returns State chọn ảnh trong Thư viện, hỗ trợ tải lên trực tiếp và chọn ngay tệp vừa tải. */
export function useAttachmentPicker() {
  const t = useTranslations("attachment");
  const errorMessage = useApiErrorMessage();
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachments();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [kinds, setKinds] = useState<string[]>(["IMAGE"]);
  const [formats, setFormats] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressName, setUploadProgressName] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);
  const [pendingMove, setPendingMove] = useState<Attachment | null>(null);
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
      });

      if (
        kinds.length === 1 &&
        kinds[0] === "IMAGE" &&
        !uploaded.contentType.startsWith("image/")
      ) {
        toast.error(t("imageOnly"));
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
        if (page > 1 && query.data?.items.length === 1) {
          setPage(page - 1);
        }
        void query.refetch();
      },
    });
  };

  const handleMoveDone = () => {
    setPendingMove(null);
    void query.refetch();
  };

  return {
    search,
    page,
    setPage,
    selected,
    setSelected,
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
    pendingMove,
    setPendingMove,
    handleMoveDone,
    changeKinds: (values: string[]) => {
      setKinds(values);
      setFormats((current) => normalizeMediaFormats(values, current));
      setPage(1);
      setSelected(null);
    },
    changeFormats: (values: string[]) => {
      setFormats(values);
      setPage(1);
      setSelected(null);
    },
    changeFolders: (values: string[]) => {
      setFolders(values);
      setPage(1);
      setSelected(null);
    },
    clearFilters: () => {
      setSearch("");
      setKinds(["IMAGE"]);
      setFormats([]);
      setFolders([]);
      setPage(1);
      setSelected(null);
    },
    applySearch: (value: string) => {
      setSearch(value);
      setPage(1);
      setSelected(null);
    },
    isDragging,
    setIsDragging,
    detailFile,
    setDetailFile,
    fileInputRef,
    triggerFileInput: () => fileInputRef.current?.click(),
    hasActiveFilters: Boolean(
      search || formats.length || folders.length || kinds.length !== 1 || kinds[0] !== "IMAGE",
    ),
  };
}
