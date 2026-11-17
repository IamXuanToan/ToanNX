"use client";

import { useState } from "react";

import { useAttachments } from "../../../hooks/use-attachments";
import type { Attachment } from "../../../types/attachment.types";
import { normalizeMediaFormats } from "../../../constants/media-types";

const PICKER_PAGE_SIZE = 12;

/** @returns State chọn ảnh trong Thư viện, không thay URL của form phía sau dialog. */
export function useAttachmentPicker() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [kinds, setKinds] = useState<string[]>(["IMAGE"]);
  const [formats, setFormats] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const query = useAttachments({
    search,
    page,
    pageSize: PICKER_PAGE_SIZE,
    ordering: "-created_at",
    kind: kinds,
    contentType: formats,
    folder: folders,
  });
  // Bỏ lựa chọn đã bị xóa qua quản lý thư mục hoặc không còn trong trang hiện tại.
  if (
    selected &&
    query.isSuccess &&
    !query.isFetching &&
    !query.isPlaceholderData &&
    !query.data.items.some((file) => file.id === selected.id)
  ) {
    setSelected(null);
  }
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
  };
}
