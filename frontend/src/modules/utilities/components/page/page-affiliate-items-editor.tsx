"use client";

import { Download, PackagePlus, Plus, Sparkles, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { SortableList } from "@/shares/components/common/sortable-list";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Label } from "@/shares/components/ui/label";

import type { AffiliateCategory, AffiliateItem } from "../../types/page.types";
import { PageAffiliateImportDialog } from "./page-affiliate-import-dialog";
import { PageAffiliateItemRow } from "./page-affiliate-item-row";

/**
 * Trình biên tập danh sách sản phẩm và liên kết affiliate hỗ trợ kéo thả sắp xếp thứ tự.
 *
 * @param props - Danh sách sản phẩm, hàm xóa sản phẩm, hàm sắp xếp lại, hàm mở modal thêm nhanh và trạng thái vô hiệu hóa.
 * @returns Trình quản lý sản phẩm affiliate.
 */
export function PageAffiliateItemsEditor({
  items,
  categories = [],
  onRemoveItem,
  onEditItem,
  onReorderItems,
  onOpenAddManual,
  onOpenQuickAdd,
  onImportItems,
  showPrice = true,
  onToggleShowPrice,
  disabled = false,
}: {
  items: AffiliateItem[];
  categories?: AffiliateCategory[];
  onRemoveItem: (id: string) => void;
  onEditItem?: (item: AffiliateItem) => void;
  onReorderItems?: (items: AffiliateItem[]) => void;
  onOpenAddManual: () => void;
  onOpenQuickAdd: () => void;
  onImportItems?: (
    items: AffiliateItem[],
    categories: AffiliateCategory[],
    mode: "append" | "replace",
  ) => void;
  showPrice?: boolean;
  onToggleShowPrice?: (show: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.itemsEditor");
  const tPages = useTranslations("utilities.customPages.pages");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleExportJson = () => {
    if (items.length === 0) {
      toast.error(t("exportEmpty"));
      return;
    }
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: categories,
      items: items,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `affiliate-products-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess"));
  };

  return (
    <div className="space-y-4">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold">{tPages("tabs.products")}</h3>
          <p className="text-muted-foreground text-xs">{t("total", { count: items.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleShowPrice ? (
            <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-1.5">
              <Checkbox
                id="affiliate-show-price-toggle"
                checked={showPrice}
                onCheckedChange={(checked) => onToggleShowPrice(Boolean(checked))}
                disabled={disabled}
              />
              <Label
                htmlFor="affiliate-show-price-toggle"
                className="cursor-pointer text-xs font-medium"
              >
                {t("showPrice")}
              </Label>
            </div>
          ) : null}

          {/* Nút Thêm sản phẩm (Thêm thường thủ công - nút chính màu xanh) */}
          <AppTooltip content={t("addProductTooltip")}>
            <span className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={onOpenAddManual}
                disabled={disabled}
                className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>{t("addProduct")}</span>
              </Button>
            </span>
          </AppTooltip>

          {/* Nút Thêm nhanh bằng URL (nút phụ outline) */}
          <AppTooltip content={t("quickAddTooltip")}>
            <span className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenQuickAdd}
                disabled={disabled}
                className="h-8 gap-1.5 text-xs font-medium shadow-2xs"
              >
                <Sparkles className="text-primary size-3.5" />
                <span>{tPages("quickAdd")}</span>
              </Button>
            </span>
          </AppTooltip>

          {/* Nút Xuất file JSON */}
          <AppTooltip content={t("exportTooltip")}>
            <span className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleExportJson}
                disabled={disabled || items.length === 0}
                className="h-8 gap-1.5 text-xs font-medium shadow-2xs"
              >
                <Download className="size-3.5" />
                <span>{t("export")}</span>
              </Button>
            </span>
          </AppTooltip>

          {/* Nút Nhập file JSON */}
          {onImportItems ? (
            <AppTooltip content={t("importTooltip")}>
              <span className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setImportDialogOpen(true)}
                  disabled={disabled}
                  className="h-8 gap-1.5 text-xs font-medium shadow-2xs"
                >
                  <Upload className="size-3.5" />
                  <span>{t("import")}</span>
                </Button>
              </span>
            </AppTooltip>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
          <div className="bg-muted/50 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <PackagePlus className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-xs">
            {t("emptyHint", { quickAdd: tPages("quickAdd") })}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onOpenAddManual}
              disabled={disabled}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("addProduct")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenQuickAdd}
              disabled={disabled}
              className="gap-1.5"
            >
              <Sparkles className="text-primary h-3.5 w-3.5" />
              <span>{tPages("quickAdd")}</span>
            </Button>
            {onImportItems ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                disabled={disabled}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{t("import")}</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <SortableList
          items={items}
          onReorder={onReorderItems ?? (() => {})}
          disabled={disabled || !onReorderItems}
          dragHandlePosition="left"
          className="space-y-2.5"
          renderItem={(item) => (
            <PageAffiliateItemRow
              item={item}
              onRemove={onRemoveItem}
              onEdit={onEditItem}
              disabled={disabled}
            />
          )}
        />
      )}

      {/* Dialog Nhập dữ liệu sản phẩm từ JSON */}
      <PageAffiliateImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={(importedItems, importedCategories, mode) => {
          onImportItems?.(importedItems, importedCategories, mode);
        }}
      />
    </div>
  );
}
