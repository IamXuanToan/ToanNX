"use client";

import { AlertCircle, CheckCircle2, Upload, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shares/components/ui/radio-group";
import { Textarea } from "@/shares/components/ui/textarea";

import type { AffiliateCategory, AffiliateItem } from "../../types/page.types";

/**
 * Modal nhập danh sách sản phẩm Affiliate từ tệp tin JSON hoặc dán trực tiếp,
 * hỗ trợ kiểm tra tính hợp lệ, tự động đồng bộ danh mục và lựa chọn thêm tiếp hay thay thế.
 *
 * @param props - Trạng thái mở, callback xác nhận nhập và đóng dialog.
 * @returns Dialog nhập sản phẩm.
 */
export function PageAffiliateImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (
    items: AffiliateItem[],
    categories: AffiliateCategory[],
    mode: "append" | "replace",
  ) => void;
}) {
  const t = useTranslations("utilities.customPages.pages.itemsEditor.importDialog");
  const tCommon = useTranslations("common.actions");
  const [jsonText, setJsonText] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [parsedItems, setParsedItems] = useState<AffiliateItem[] | null>(null);
  const [parsedCategories, setParsedCategories] = useState<AffiliateCategory[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setJsonText("");
    setParsedItems(null);
    setParsedCategories([]);
    setErrorMsg(null);
    setImportMode("append");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseJsonData = (rawString: string) => {
    setErrorMsg(null);
    setParsedItems(null);
    setParsedCategories([]);

    if (!rawString.trim()) return;

    try {
      const parsed = JSON.parse(rawString);
      let rawItems: unknown[] = [];
      let rawCats: unknown[] = [];

      if (Array.isArray(parsed)) {
        rawItems = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.items)) {
          rawItems = obj.items;
        }
        if (Array.isArray(obj.categories)) {
          rawCats = obj.categories;
        }
      }

      if (rawItems.length === 0) {
        setErrorMsg(t("errorNoItems"));
        return;
      }

      // Chuẩn hóa và làm sạch danh sách sản phẩm
      const validItems: AffiliateItem[] = [];
      for (const it of rawItems) {
        if (typeof it === "object" && it !== null) {
          const itemObj = it as Record<string, unknown>;
          const title = String(itemObj.title ?? "").trim();
          const destinationUrl = String(
            itemObj.destinationUrl ?? itemObj.destination_url ?? "",
          ).trim();

          if (title) {
            const rawPrice = (itemObj.priceConfig ?? itemObj.price_config ?? {}) as Record<
              string,
              unknown
            >;
            const rawBadge = (itemObj.badge ?? {}) as Record<string, unknown>;

            validItems.push({
              id: String(itemObj.id ?? `item-${crypto.randomUUID().slice(0, 8)}`),
              displayMode: "product",
              title,
              rawTitle: itemObj.rawTitle ? String(itemObj.rawTitle) : undefined,
              description: itemObj.description ? String(itemObj.description) : undefined,
              categoryId: String(itemObj.categoryId ?? itemObj.category_id ?? "default"),
              destinationUrl: destinationUrl || "#",
              platform: (itemObj.platform as AffiliateItem["platform"]) ?? "custom",
              imageUrl: itemObj.imageUrl
                ? String(itemObj.imageUrl)
                : itemObj.image_url
                  ? String(itemObj.image_url)
                  : undefined,
              priceConfig: {
                mode: (rawPrice.mode as AffiliateItem["priceConfig"]["mode"]) ?? "fixed",
                amount: rawPrice.amount ? Number(rawPrice.amount) : undefined,
                originalAmount: rawPrice.originalAmount
                  ? Number(rawPrice.originalAmount)
                  : rawPrice.original_amount
                    ? Number(rawPrice.original_amount)
                    : undefined,
                currency: "VND",
                priceNote: rawPrice.priceNote ? String(rawPrice.priceNote) : undefined,
              },
              buttonConfig: {
                label: t("defaultCtaLabel"),
                openInNewTab: true,
              },
              badge: rawBadge.text
                ? {
                    text: String(rawBadge.text),
                    tone: "hot",
                    bgColor: rawBadge.bgColor ? String(rawBadge.bgColor) : undefined,
                    textColor: rawBadge.textColor ? String(rawBadge.textColor) : undefined,
                  }
                : undefined,
              sortOrder: Number(itemObj.sortOrder ?? itemObj.sort_order ?? validItems.length),
              isVisible: true,
            });
          }
        }
      }

      if (validItems.length === 0) {
        setErrorMsg(t("errorMissingTitle"));
        return;
      }

      // Chuẩn hóa danh mục nếu có
      const validCategories: AffiliateCategory[] = [];
      for (const cat of rawCats) {
        if (typeof cat === "object" && cat !== null) {
          const catObj = cat as Record<string, unknown>;
          const name = String(catObj.name ?? "").trim();
          if (name) {
            validCategories.push({
              id: String(catObj.id ?? `cat-${crypto.randomUUID().slice(0, 8)}`),
              name,
              slug: String(catObj.slug ?? `cat-${Date.now()}`),
              sortOrder: Number(catObj.sortOrder ?? catObj.sort_order ?? validCategories.length),
              isVisible: true,
            });
          }
        }
      }

      setParsedItems(validItems);
      setParsedCategories(validCategories);
    } catch {
      setErrorMsg(t("errorInvalidJson"));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result ?? "");
      setJsonText(content);
      parseJsonData(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    if (!parsedItems || parsedItems.length === 0) {
      toast.error(t("errorEmptyToImport"));
      return;
    }

    onImport(parsedItems, parsedCategories, importMode);
    toast.success(t("successToast", { count: parsedItems.length }));
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Upload className="text-primary size-4.5" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nút chọn file từ máy */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 flex h-auto w-full flex-col items-center justify-center rounded-xl border-dashed py-6 text-center font-normal whitespace-normal transition-all"
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="bg-primary/10 mb-2 flex size-10 items-center justify-center rounded-full">
              <UploadCloud className="text-primary size-5" />
            </div>
            <p className="text-xs font-semibold">{t("dropzoneTitle")}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">{t("dropzoneSubtitle")}</p>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-border w-full border-t" />
            <span className="bg-background text-muted-foreground absolute px-3 text-[11px] font-medium uppercase">
              {t("orPaste")}
            </span>
          </div>

          {/* Ô dán JSON trực tiếp */}
          <div className="space-y-1.5">
            <Label htmlFor="import-json-text" className="text-xs font-medium">
              {t("jsonContent")}
            </Label>
            <Textarea
              id="import-json-text"
              rows={5}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                parseJsonData(e.target.value);
              }}
              placeholder={t("jsonPlaceholder")}
              className="font-mono text-xs"
            />
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMsg ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {/* Xem trước kết quả hợp lệ */}
          {parsedItems && parsedItems.length > 0 ? (
            <div className="border-border bg-primary/5 border-primary/20 space-y-3 rounded-xl border p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>
                  {parsedCategories.length > 0
                    ? t("previewWithCategories", {
                        itemCount: parsedItems.length,
                        catCount: parsedCategories.length,
                      })
                    : t("previewItems", { itemCount: parsedItems.length })}
                </span>
              </div>

              {/* Lựa chọn cách thức nhập */}
              <div className="border-border/60 space-y-2 border-t pt-2.5">
                <Label className="text-xs font-semibold">{t("modeTitle")}</Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(val) => setImportMode(val as "append" | "replace")}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="mode-append"
                    className="border-border bg-card hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors"
                  >
                    <RadioGroupItem value="append" id="mode-append" className="mt-0.5" />
                    <div className="text-xs">
                      <span className="font-semibold">{t("modeAppendTitle")}</span>
                      <p className="text-muted-foreground text-[11px]">{t("modeAppendDesc")}</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="mode-replace"
                    className="border-border bg-card hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors"
                  >
                    <RadioGroupItem value="replace" id="mode-replace" className="mt-0.5" />
                    <div className="text-xs">
                      <span className="text-destructive font-semibold">
                        {t("modeReplaceTitle")}
                      </span>
                      <p className="text-muted-foreground text-[11px]">{t("modeReplaceDesc")}</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs">
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!parsedItems || parsedItems.length === 0}
            onClick={handleConfirmImport}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Upload className="size-3.5" />
            <span>{t("confirm", { count: parsedItems?.length ?? 0 })}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
