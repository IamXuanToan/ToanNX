"use client";

import { useState } from "react";

import { useAttachments } from "../../../hooks/use-attachments";
import type { Attachment } from "../../../types/attachment.types";
import { normalizeMediaFormats } from "../../../constants/media-types";

const PICKER_PAGE_SIZE = 12;

/** @param canRead - Có được xem thư viện hay không. @returns State cục bộ, không thay URL của form phía sau dialog. */
export function useAttachmentPicker(canRead: boolean) {
  const [tab, setTab] = useState(canRead ? "library" : "upload");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [kinds, setKinds] = useState<string[]>(["IMAGE"]);
  const [formats, setFormats] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const query = useAttachments(
    {
      search,
      page,
      pageSize: PICKER_PAGE_SIZE,
      ordering: "-created_at",
      kind: kinds,
      contentType: formats,
      folder: folders,
    },
    canRead,
  );
  // Bỏ lựa chọn đã bị xóa qua quản lý thư mục hoặc không còn trong trang hiện tại.
  if (
    selected &&
    canRead &&
    query.isSuccess &&
    !query.isFetching &&
    !query.isPlaceholderData &&
    !query.data.items.some((file) => file.id === selected.id)
  ) {
    setSelected(null);
  }
  return {
    tab,
    setTab,
    search,
    page,
    setPage,
    selected,
    setSelected,
    busy,
    setBusy,
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
    uploaded: (file: Attachment) => {
      setSelected(file);
      setKinds(["IMAGE"]);
      setFormats([]);
      setFolders([]);
      setSearch("");
      setPage(1);
      if (canRead) setTab("library");
    },
  };
}
