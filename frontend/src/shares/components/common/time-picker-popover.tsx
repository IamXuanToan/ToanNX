"use client";

import { cn } from "cn";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { HOUR_OPTIONS } from "@/shares/lib/date-time-input";

import { FORM_CONTROL_TRIGGER_CLASS } from "./form-control.styles";
import { useTimePickerPopover } from "./hooks/use-time-picker-popover";
import { TimeScrollColumn } from "./time-scroll-column";

/**
 * Nút chọn giờ dạng popover hai cột (giờ / phút).
 * Hỗ trợ chế độ `inline` khi nằm trong khung chung `DateTimePicker`/`TimePicker` và nút xoá giờ trong popover.
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
  inline = false,
  clearable = false,
  onClear,
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
  inline?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
}) {
  const t = useTranslations("common.timePicker");
  const { open, setOpen, display } = useTimePickerPopover(hour, minute);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={inline ? "ghost" : "outline"}
          disabled={disabled}
          aria-expanded={open}
          aria-label={t("label")}
          className={cn(
            inline
              ? "hover:bg-muted/50 h-full gap-1.5 rounded-none px-2.5 text-left text-sm font-normal tabular-nums focus-visible:ring-0"
              : cn(FORM_CONTROL_TRIGGER_CLASS, "tabular-nums"),
            className,
          )}
        >
          <Clock3
            className={cn("text-muted-foreground shrink-0", inline ? "size-3.5" : "size-4")}
            aria-hidden
          />
          <span
            className={cn(
              inline ? "whitespace-nowrap" : "truncate",
              !hasValue && "text-muted-foreground",
            )}
          >
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
        <div className="flex items-center justify-between gap-2 border-t p-1">
          {clearable && hasValue && onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium"
            onClick={() => setOpen(false)}
          >
            {t("done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
