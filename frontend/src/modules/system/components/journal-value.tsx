"use client";

import { cn } from "cn";

import { Badge } from "@/shares/components/ui/badge";

import { JOURNAL_MASK, useJournalFormat } from "../hooks/use-journal-format";

/**
 * Giá trị đầy đủ của một field ở trang chi tiết: danh sách thành chip, JSON dàn trang, văn bản dài xuống dòng.
 *
 * @param props - Giá trị thô; với danh sách, các phần tử trong `marked` được tô theo `tone` (thêm/bỏ).
 * @returns Nội dung hiển thị.
 */
export function JournalValue({
  value,
  marked = [],
  tone,
}: {
  value: unknown;
  marked?: unknown[];
  tone?: "added" | "removed";
}) {
  const markedKeys = new Set(marked.map((item) => JSON.stringify(item)));
  const journal = useJournalFormat();
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item) => {
          const highlighted = markedKeys.has(JSON.stringify(item));
          return (
            <Badge
              key={JSON.stringify(item)}
              variant="outline"
              className={cn(
                "font-mono text-xs font-normal break-all",
                highlighted && tone === "added" && "border-success/40 bg-success/10 text-success",
                highlighted &&
                  tone === "removed" &&
                  "border-destructive/40 bg-destructive/10 text-destructive line-through",
              )}
            >
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </Badge>
          );
        })}
      </div>
    );
  }
  if (value !== null && typeof value === "object") {
    return (
      <pre className="bg-muted/60 max-h-80 overflow-auto rounded-lg p-2 font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (value === JOURNAL_MASK)
    return <span className="text-muted-foreground">{journal.value(value)}</span>;
  return <span className="break-words whitespace-pre-wrap">{journal.value(value, Infinity)}</span>;
}
