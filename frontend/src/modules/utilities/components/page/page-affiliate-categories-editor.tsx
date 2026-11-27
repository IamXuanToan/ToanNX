"use client";

import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { SortableList } from "@/shares/components/common/sortable-list";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import type { AffiliateCategory } from "../../types/page.types";

/**
 * Trình quản lý danh mục phân loại cho trang Affiliate theo dạng danh sách dọc (List view)
 * trực quan, hiển thị rõ thứ tự trước sau và hỗ trợ kéo thả sắp xếp, sửa tên và xóa.
 *
 * @param props - Danh sách danh mục, hàm thêm, hàm xóa, hàm sửa, hàm sắp xếp lại và cờ vô hiệu hóa.
 * @returns Trình quản lý danh mục dạng danh sách dọc.
 */
export function PageAffiliateCategoriesEditor({
  categories,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onReorderCategories,
  disabled = false,
}: {
  categories: AffiliateCategory[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (id: string) => void;
  onUpdateCategory?: (id: string, newName: string) => void;
  onReorderCategories?: (categories: AffiliateCategory[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.categoriesEditor");
  const tCommon = useTranslations("common.actions");
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (cat: AffiliateCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = (id: string) => {
    if (!editingName.trim()) return;
    if (onUpdateCategory) {
      onUpdateCategory(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="text-muted-foreground text-xs">{t("description")}</p>
      </div>

      {/* Ô nhập thêm danh mục */}
      <div className="flex gap-2">
        <Input
          placeholder={t("placeholder")}
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-9 flex-1 text-xs"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !newCatName.trim()}
          className="h-9 gap-1 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t("add")}</span>
        </Button>
      </div>

      {/* Danh sách danh mục dạng List dọc */}
      <div className="pt-1">
        {categories.length === 0 ? (
          <div className="border-border bg-muted/20 text-muted-foreground rounded-xl border border-dashed py-6 text-center text-xs italic">
            {t("empty")}
          </div>
        ) : (
          <SortableList
            items={categories}
            onReorder={onReorderCategories ?? (() => {})}
            disabled={disabled || !onReorderCategories}
            dragHandlePosition="left"
            keyExtractor={(cat, idx) => cat.id || `cat-${idx}`}
            className="space-y-2"
            renderItem={(cat, { index }) => {
              const isEditing = editingId === cat.id;

              return (
                <div className="group border-border bg-card hover:border-primary/40 flex items-center justify-between gap-3 rounded-xl border p-2.5 shadow-2xs transition-all hover:shadow-xs">
                  {/* Số thứ tự rõ ràng trước sau */}
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold">
                      #{index + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(cat.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="h-7 text-xs font-medium"
                        />
                        <AppTooltip content={t("saveCategory")}>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => saveEdit(cat.id)}
                            className="text-primary hover:bg-primary/10 size-7"
                          >
                            <Check className="size-3.5" />
                          </Button>
                        </AppTooltip>
                        <AppTooltip content={tCommon("cancel")}>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="text-muted-foreground hover:bg-muted size-7"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </AppTooltip>
                      </div>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Tag className="text-muted-foreground size-3.5 shrink-0 opacity-60" />
                        <span className="text-foreground truncate text-xs font-semibold">
                          {cat.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Các nút Thao tác Sửa / Xóa */}
                  {!isEditing && (
                    <div className="flex shrink-0 items-center gap-1">
                      {onUpdateCategory && (
                        <AppTooltip content={t("editCategory")}>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEdit(cat)}
                              disabled={disabled}
                              className="text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-md"
                              aria-label={t("editCategory")}
                            >
                              <Pencil className="size-3" />
                            </Button>
                          </span>
                        </AppTooltip>
                      )}
                      <AppTooltip content={t("deleteCategory", { name: cat.name })}>
                        <span className="inline-flex">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onRemoveCategory(cat.id)}
                            disabled={disabled}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7 rounded-md"
                            aria-label={t("deleteCategory", { name: cat.name })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      </AppTooltip>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
