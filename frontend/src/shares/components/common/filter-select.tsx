"use client";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/shares/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import type { SelectOption } from "./select-field";
import { useFilterSelect } from "./hooks/use-filter-select";

/**
 * Bộ lọc chọn nhiều chuẩn của bảng (mọi bộ lọc trên toolbar dùng component này).
 * Ô cao 40px như mọi control: chưa chọn thì hiện tên bộ lọc; chọn một thì hiện "Tên: giá trị";
 * chọn nhiều thì hiện "Tên" + số đã chọn. Popover có danh sách checkbox, ô tìm (bỏ dấu) khi
 * nhiều lựa chọn, hai nút "Chọn tất cả" và "Xoá lọc" cùng hàng ở cuối menu. Điều khiển
 * (controlled), giá trị là mảng.
 *
 * @param props - Tên bộ lọc, lựa chọn, giá trị và callback.
 * @returns Bộ lọc chọn nhiều.
 */
export function FilterSelect({
  label,
  options,
  value,
  onValueChange,
  searchable,
  disabled,
  className,
}: {
  /** Tên bộ lọc, cũng là `aria-label`. */
  label: string;
  options: SelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Ép có/không ô tìm; mặc định tự bật khi có từ 8 lựa chọn. */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.filter");
  const tSelect = useTranslations("common.select");
  const state = useFilterSelect({ options, value, onValueChange, searchable });
  const single = state.selected.length === 1 ? state.selected[0] : undefined;

  return (
    <Popover open={state.open} onOpenChange={state.onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          aria-expanded={state.open}
          aria-controls={state.listId}
          disabled={disabled}
          data-active={state.selected.length > 0 || undefined}
          className={cn(
            FORM_CONTROL_TRIGGER_CLASS,
            "data-active:border-primary/40 data-active:bg-primary-light/60 w-auto max-w-72 justify-between",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("shrink-0", state.selected.length === 0 && "text-foreground")}>
              {label}
              {single ? ":" : null}
            </span>
            {single ? (
              <span className="text-primary min-w-0 truncate font-medium">{single.label}</span>
            ) : null}
            {state.selected.length > 1 ? (
              <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                {state.selected.length}
              </span>
            ) : null}
          </span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command className="rounded-xl">
          {state.isSearchable ? (
            <CommandInput
              value={state.keyword}
              onValueChange={state.setKeyword}
              placeholder={tSelect("search")}
            />
          ) : null}
          <CommandList
            id={state.listId}
            aria-multiselectable
            aria-label={label}
            className="max-h-64 p-1"
          >
            {state.filtered.length === 0 ? (
              <CommandEmpty>{tSelect("empty")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {state.filtered.map((option) => {
                  const checked = state.value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => !option.disabled && state.toggle(option.value)}
                      className="cursor-pointer gap-2"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={option.disabled}
                        onCheckedChange={() => state.toggle(option.value)}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.description ? (
                          <span className="text-muted-foreground block truncate text-xs">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          {(state.hasMultipleSelectable && !state.keyword) || state.value.length ? (
            <>
              <CommandSeparator />
              <div className="flex gap-1 p-1">
                {state.hasMultipleSelectable && !state.keyword ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-w-0 flex-1"
                    disabled={state.allSelected}
                    onClick={state.selectAll}
                  >
                    {t("selectAll")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="min-w-0 flex-1"
                  disabled={!state.value.length}
                  onClick={state.clear}
                >
                  {t("clear")}
                </Button>
              </div>
            </>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
