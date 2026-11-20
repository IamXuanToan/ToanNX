/**
 * Hộp thoại (Dialog) nhập dữ liệu tiểu thuyết từ file JSON hoặc văn bản dán trực tiếp.
 */

"use client";

import { Download, FileJson, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

import { useNovelImportDialog } from "./hooks/use-novel-import-dialog";

/**
 * Component Dialog hỗ trợ quản trị viên nhập dữ liệu tiểu thuyết kèm danh sách chương.
 *
 * Cung cấp nút tải template mẫu JSON, ô chọn file `.json` và khung dán trực tiếp nội dung JSON.
 *
 * @returns Khối Dialog nhập tiểu thuyết.
 */
export function NovelImportDialog() {
  const t = useTranslations("novel.import");
  const {
    open,
    setOpen,
    jsonText,
    setJsonText,
    isDownloading,
    isImporting,
    handleDownloadTemplate,
    handleFileChange,
    handleSubmit,
  } = useNovelImportDialog();

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
            <Input
              id="novel-file-upload"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer"
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
              placeholder='{ "novel": { "title": "..." }, "chapters": [...] }'
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
            disabled={isImporting}
          >
            {t("cancelButton")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isImporting} className="gap-2">
            {isImporting ? (
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
