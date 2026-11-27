"use client";

import { cn } from "cn";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { type ChipItemParseResult, useChipListInput } from "./hooks/use-chip-list-input";
import { InlineHelpTooltip } from "./inline-help-tooltip";

/**
 * Ô quản lý danh sách giá trị dạng chip/badge (khung giờ `HH:MM`, mốc ngày `30, 7, 1`…):
 * hiển thị các chip dễ xoá kèm ô gõ + nút Thêm + biểu tượng chấm than Tooltip giải thích phím Enter,
 * và tùy chọn hàng nút mẫu chọn nhanh (`presets`).
 *
 * @param props - Danh sách giá trị, callback, bộ chuẩn hoá, nút mẫu và cấu hình hiển thị.
 * @returns Thành phần nhập danh sách chip.
 */
export function ChipListInput({
  id,
  values,
  onChange,
  parseItem,
  sortItems,
  formatItem,
  presets,
  placeholder,
  addLabel,
  emptyText,
  tooltip,
  tooltipLabel,
  disabled,
  maxLength,
  className,
}: {
  id?: string;
  values: readonly string[];
  onChange: (next: string[]) => void;
  parseItem?: (raw: string) => ChipItemParseResult;
  sortItems?: (items: string[]) => string[];
  formatItem?: (value: string) => string;
  presets?: readonly { value: string; label: string }[];
  placeholder?: string;
  addLabel?: string;
  emptyText?: string;
  tooltip?: ReactNode;
  tooltipLabel?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}) {
  const t = useTranslations("common.chipListInput");
  const errorId = useId();
  const state = useChipListInput({ values, onChange, parseItem, sortItems });

  const togglePreset = (presetValue: string) => {
    if (disabled) return;
    const exists = values.includes(presetValue);
    const rawNext = exists
      ? values.filter((item) => item !== presetValue)
      : [...values, presetValue];
    const next = sortItems ? sortItems(rawNext) : rawNext;
    onChange(next);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[11rem] flex-1 sm:max-w-xs">
          <Input
            id={id}
            value={state.draft}
            disabled={disabled}
            maxLength={maxLength}
            onChange={(event) => state.setDraft(event.target.value)}
            onKeyDown={state.handleKeyDown}
            placeholder={placeholder ?? t("placeholder")}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
            className="h-10 pr-9"
          />
          <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
            <InlineHelpTooltip
              content={tooltip ?? t("tooltip")}
              label={tooltipLabel ?? t("tooltipLabel")}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={state.addDraft}
          className="h-10 shrink-0 gap-1.5"
        >
          <Plus className="size-4" aria-hidden />
          <span>{addLabel ?? t("add")}</span>
        </Button>
      </div>

      {state.error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}

      {presets?.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => {
            const active = values.includes(preset.value);
            return (
              <Button
                key={preset.value}
                type="button"
                size="sm"
                variant={active ? "secondary" : "outline"}
                disabled={disabled}
                onClick={() => togglePreset(preset.value)}
                className="h-7 rounded-lg px-2.5 text-xs"
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((item) => {
            const display = formatItem ? formatItem(item) : item;
            return (
              <Badge
                key={item}
                variant="secondary"
                className="h-7 gap-1 rounded-lg border px-2.5 text-xs font-medium"
              >
                <span className="tabular-nums">{display}</span>
                {disabled ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => state.removeItem(item)}
                    aria-label={t("remove", { item: display })}
                    className="text-muted-foreground hover:text-foreground ml-0.5 size-4 rounded-full hover:bg-transparent"
                  >
                    <X className="size-3" aria-hidden />
                  </Button>
                )}
              </Badge>
            );
          })}
        </div>
      ) : emptyText ? (
        <p className="text-muted-foreground text-xs">{emptyText}</p>
      ) : null}
    </div>
  );
}
