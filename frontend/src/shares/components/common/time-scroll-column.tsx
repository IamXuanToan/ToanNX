"use client";

import { cn } from "cn";

import { Button } from "@/shares/components/ui/button";

import { useTimeScrollColumn } from "./hooks/use-time-picker-popover";

/**
 * Một cột cuộn chọn giờ hoặc phút; mở ra thì cuộn mục đang chọn vào giữa.
 *
 * @param props - Nhãn cột, lựa chọn, giá trị, popover đang mở, callback.
 * @returns Cột chọn.
 */
export function TimeScrollColumn({
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
