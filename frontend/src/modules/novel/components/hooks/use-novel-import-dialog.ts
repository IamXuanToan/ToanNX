"use client";

import { useTranslations } from "next-intl";
import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";

import { useImportNovel } from "../../hooks/use-import-novel";
import { novelService } from "../../services/novel.service";
import type { NovelImportPayload } from "../../types/novel-import.types";

/**
 * Hook quản lý toàn bộ logic nhập dữ liệu tiểu thuyết trong NovelImportDialog:
 * - Đóng/mở dialog và lưu nội dung JSON.
 * - Tải template mẫu JSON từ backend.
 * - Đọc file JSON từ thiết bị người dùng.
 * - Parse JSON và gọi mutation import tiểu thuyết.
 *
 * @returns Trạng thái dialog, nội dung JSON, cờ đang tải template/import và các hàm xử lý.
 */
export function useNovelImportDialog() {
  const t = useTranslations("novel.import");
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const importMutation = useImportNovel(() => {
    setOpen(false);
    setJsonText("");
  });

  /**
   * Tải file JSON mẫu từ backend về máy tính của người dùng.
   */
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const template = await novelService.getImportTemplate();
      const blob = new Blob([JSON.stringify(template, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "novel-import-template.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("downloadTemplateSuccess"));
    } catch {
      toast.error(t("downloadTemplateError"));
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Đọc nội dung khi người dùng chọn một file JSON từ máy tính.
   *
   * @param e - Sự kiện thay đổi của thẻ input file.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      toast.success(t("fileLoaded", { name: file.name }));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /**
   * Parse chuỗi JSON và gửi mutation import lên backend.
   */
  const handleSubmit = () => {
    if (!jsonText.trim()) {
      toast.error(t("emptyJsonError"));
      return;
    }

    try {
      const payload = JSON.parse(jsonText) as NovelImportPayload;
      if (!payload.novel?.title || !Array.isArray(payload.chapters)) {
        toast.error(t("invalidFormatError"));
        return;
      }
      importMutation.mutate(payload);
    } catch {
      toast.error(t("jsonSyntaxError"));
    }
  };

  return {
    open,
    setOpen,
    jsonText,
    setJsonText,
    isDownloading,
    isImporting: importMutation.isPending,
    handleDownloadTemplate,
    handleFileChange,
    handleSubmit,
  };
}
