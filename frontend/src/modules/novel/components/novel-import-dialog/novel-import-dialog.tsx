/**
 * Hộp thoại (Dialog) nhập dữ liệu tiểu thuyết từ file JSON hoặc văn bản dán trực tiếp.
 */

"use client";

import { Download, FileJson, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

import { useImportNovel } from "../../hooks/use-import-novel";
import { novelService } from "../../services/novel.service";
import type { NovelImportPayload } from "../../types/novel-import.types";

/**
 * Component Dialog hỗ trợ quản trị viên nhập dữ liệu tiểu thuyết kèm danh sách chương.
 *
 * Cung cấp nút tải template mẫu JSON, ô chọn file `.json` và khung dán trực tiếp nội dung JSON.
 *
 * @returns Khối Dialog nhập tiểu thuyết.
 */
export function NovelImportDialog() {
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
    };
    reader.readAsText(file);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          <span>{t("triggerButton")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="text-primary h-5 w-5" />
            <span>{t("dialogTitle")}</span>
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tải template mẫu */}
          <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">{t("templateGuideTitle")}</p>
              <p className="text-muted-foreground text-[11px]">{t("templateGuideDescription")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="gap-1.5 text-xs"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{t("downloadTemplateButton")}</span>
            </Button>
          </div>

          {/* Chọn file từ máy */}
          <div className="space-y-1.5">
            <Label htmlFor="novel-file-upload" className="text-xs">
              {t("chooseFileLabel")}
            </Label>
            <input
              id="novel-file-upload"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="border-input file:text-foreground text-muted-foreground block w-full rounded-md border p-1.5 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-xs file:font-medium hover:file:cursor-pointer"
            />
          </div>

          {/* Khung dán JSON */}
          <div className="space-y-1.5">
            <Label htmlFor="novel-json-content" className="text-xs">
              {t("jsonContentLabel")}
            </Label>
            <Textarea
              id="novel-json-content"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{ "title": "...", "chapters": [...] }'
              rows={8}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={importMutation.isPending}
          >
            {t("cancelButton")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={importMutation.isPending}
            className="gap-2"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("importingButton")}</span>
              </>
            ) : (
              <span>{t("submitButton")}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
