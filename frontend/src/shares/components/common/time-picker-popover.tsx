"use client";

import { cn } from "cn";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { HOUR_OPTIONS } from "@/shares/lib/date-time-input";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { useTimePickerPopover, useTimeScrollColumn } from "./hooks/use-time-picker-popover";

/**
 * Một cột cuộn chọn giờ hoặc phút; mở ra thì cuộn mục đang chọn vào giữa.
 *
 * @param props - Nhãn cột, lựa chọn, giá trị, popover đang mở, callback.
 * @returns Cột chọn.
 */
function TimeScrollColumn({
  label,
  options,
  value,
  open,
  onSelect,
}: {
  label: string;
  options: number[];
  value: number;
  open: boolean;
  onSelect: (value: number) => void;
}) {
  const { viewportRef, selectedRef } = useTimeScrollColumn(open, value);

  return (
    <div className="flex w-20 flex-col">
      <div className="text-muted-foreground border-b px-3 py-2.5 text-center text-xs font-medium">
        {label}
      </div>
      <div
        ref={viewportRef}
        className="h-64 overflow-y-auto overscroll-y-contain p-1"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          {options.map((item) => {
            const selected = item === value;
            return (
              <Button
                key={item}
                ref={selected ? selectedRef : undefined}
                type="button"
                variant={selected ? "default" : "ghost"}
                aria-pressed={selected}
                className={cn(
                  "hover:bg-accent focus-visible:bg-accent flex h-10 w-full items-center justify-center rounded-lg text-sm tabular-nums outline-none",
                  selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => onSelect(item)}
              >
                {String(item).padStart(2, "0")}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Nút chọn giờ dạng popover hai cột (giờ / phút), theo TimePickerPopover của Medoly.
 *
 * @param props - Giờ, phút, các phút được chọn, callback và trạng thái.
 * @returns Nút chọn giờ.
 */
export function TimePickerPopover({
  hour,
  minute,
  minuteOptions,
  onHourChange,
  onMinuteChange,
  disabled,
  placeholder,
  hasValue,
  className,
}: {
  hour: number;
  minute: number;
  minuteOptions: number[];
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  disabled?: boolean;
  placeholder?: string;
  hasValue: boolean;
  className?: string;
}) {
  const t = useTranslations("common.timePicker");
  const { open, setOpen, display } = useTimePickerPopover(hour, minute);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-label={t("label")}
          className={cn(FORM_CONTROL_TRIGGER_CLASS, "tabular-nums", className)}
        >
          <Clock3 className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className={cn("truncate", !hasValue && "text-muted-foreground")}>
            {hasValue ? display : (placeholder ?? t("placeholder"))}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-0 overflow-hidden rounded-xl p-0"
        align="start"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="flex divide-x">
          <TimeScrollColumn
            label={t("hour")}
            options={HOUR_OPTIONS}
            value={hour}
            open={open}
            onSelect={onHourChange}
          />
          <TimeScrollColumn
            label={t("minute")}
            options={minuteOptions}
            value={minute}
            open={open}
            onSelect={onMinuteChange}
          />
        </div>
        <div className="flex justify-end border-t p-1">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
