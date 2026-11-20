"use client";

import { cn } from "cn";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import { Card } from "@/shares/components/ui/card";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Switch } from "@/shares/components/ui/switch";

import { CHOICE_SEARCHABLE_THRESHOLD, useChoiceList } from "./hooks/use-choice-list";
import type { ChoiceControl, ChoiceItem, ChoiceLayout } from "./choice-list.types";

/**
 * Danh sách chọn chuẩn của hệ thống — **mọi** chỗ hiện/chọn vai trò, quyền, cờ trạng thái dùng
 * component này (hoặc `ChoiceGroups` khi chia nhóm), không dựng kiểu riêng từng màn.
 * Mỗi mục: nhãn, mã (mono), mô tả, badge; control ở bên phải; mục đang chọn tô nền nhấn nhạt;
 * bấm cả dòng/card để đổi. `control="none"` là chỉ xem. Từ `CHOICE_SEARCHABLE_THRESHOLD` mục trở lên
 * có ô tìm (lọc ngay, bỏ dấu, theo nhãn/mã/mô tả) — chuẩn cho danh sách dài (nhiều vai trò…).
 *
 * @param props - Mục, giá trị đã chọn, callback, kiểu control, bố cục và trạng thái khoá.
 * @returns Danh sách chọn.
 */
export function ChoiceList({
  items,
  value,
  onToggle,
  control = "checkbox",
  layout = "list",
  disabled,
  searchable,
  className,
  "aria-label": ariaLabel,
}: {
  items: ChoiceItem[];
  value: readonly string[];
  onToggle?: (value: string, selected: boolean) => void;
  control?: ChoiceControl;
  layout?: ChoiceLayout;
  disabled?: boolean;
  /** Ép có/không ô tìm; mặc định tự bật khi có từ `CHOICE_SEARCHABLE_THRESHOLD` mục. */
  searchable?: boolean;
  /** Class thêm cho khung (ví dụ `max-h-[28rem] overflow-y-auto` khi danh sách dài). */
  className?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.choice");
  const tSelect = useTranslations("common.select");
  const state = useChoiceList(items);
  const showSearch = searchable ?? items.length >= CHOICE_SEARCHABLE_THRESHOLD;
  const visible = showSearch ? state.filtered : items;
  if (!items.length) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{t("empty")}</p>;
  }

  const list = (
    <div
      role="list"
      aria-label={ariaLabel}
      className={cn(
        layout === "grid"
          ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          : "bg-card divide-y overflow-hidden rounded-xl border",
        className,
      )}
    >
      {visible.map((item) => {
        const selected = value.includes(item.value);
        const locked = disabled || item.disabled;
        const interactive = control !== "none" && Boolean(onToggle);
        const content = (
          <>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{item.label}</span>
                {item.badge ? (
                  <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                    {item.badge}
                  </Badge>
                ) : null}
              </span>
              {item.code ? (
                <code className="text-muted-foreground block truncate font-mono text-xs">
                  {item.code}
                </code>
              ) : null}
              {item.description ? (
                <span className="text-muted-foreground line-clamp-2 block text-xs">
                  {item.description}
                </span>
              ) : null}
            </span>
            {control === "checkbox" ? (
              <Checkbox
                checked={selected}
                disabled={locked || !interactive}
                onCheckedChange={(checked) => onToggle?.(item.value, checked === true)}
                onClick={(event) => event.stopPropagation()}
                aria-label={item.label}
                className="mt-0.5"
              />
            ) : null}
            {control === "switch" ? (
              <Switch
                checked={selected}
                disabled={locked || !interactive}
                onCheckedChange={(checked) => onToggle?.(item.value, checked)}
                onClick={(event) => event.stopPropagation()}
                aria-label={item.label}
              />
            ) : null}
          </>
        );
        const itemClass = cn(
          "flex min-w-0 items-start gap-3 transition-colors",
          layout === "grid" ? "h-full p-3" : "px-4 py-3",
          // Chỉ tô mục đã chọn khi là lựa chọn (checkbox); công tắc tự nói trạng thái.
          selected && control === "checkbox"
            ? layout === "grid"
              ? "border-primary/40 bg-primary-light/50"
              : "bg-primary-light/40"
            : layout === "grid"
              ? "bg-canvas/60"
              : "bg-card",
          interactive && !locked && "hover:bg-surface-hover cursor-pointer",
          interactive && locked && "cursor-not-allowed opacity-70",
        );

        if (layout === "grid") {
          return (
            <Card
              key={item.value}
              className={cn("relative min-w-0 overflow-hidden", itemClass)}
              role={interactive ? "button" : undefined}
              tabIndex={interactive && !locked ? 0 : undefined}
              onClick={() => interactive && !locked && onToggle?.(item.value, !selected)}
              onKeyDown={(event) => {
                if (!interactive || locked) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggle?.(item.value, !selected);
                }
              }}
            >
              {content}
            </Card>
          );
        }

        return (
          <div
            key={item.value}
            role={interactive ? "button" : undefined}
            tabIndex={interactive && !locked ? 0 : undefined}
            onClick={() => interactive && !locked && onToggle?.(item.value, !selected)}
            onKeyDown={(event) => {
              if (!interactive || locked) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle?.(item.value, !selected);
              }
            }}
            className={cn("relative min-w-0", itemClass)}
          >
            {content}
          </div>
        );
      })}
    </div>
  );

  if (!showSearch) return list;
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={state.keyword}
          onChange={(event) => state.setKeyword(event.target.value)}
          placeholder={tSelect("search")}
          aria-label={tSelect("search")}
          className="pl-9"
        />
      </div>
      {visible.length ? (
        list
      ) : (
        <p className="text-muted-foreground py-6 text-center text-sm">{tSelect("empty")}</p>
      )}
    </div>
  );
}

export type * from "./choice-list.types";
