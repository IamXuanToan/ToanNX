"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import type { MarkdownTableAlign } from "@/shares/lib/markdown";
import { cn } from "cn";

const TABLE_ALIGN_CLASSES: Record<MarkdownTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export type MarkdownTableBlockProps = {
  headers: ReactNode[];
  rows: ReactNode[][];
  alignments: MarkdownTableAlign[];
  copyText: string;
};

/**
 * Hiển thị bảng Markdown GFM trong chat/mô tả kèm nút sao chép nhanh (TSV).
 *
 * @param props - Tiêu đề, các dòng dữ liệu đã render inline, căn lề cột và chuỗi TSV để sao chép.
 */
export function MarkdownTableBlock({
  headers,
  rows,
  alignments,
  copyText,
}: MarkdownTableBlockProps) {
  const t = useTranslations("common.markdownTable");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success(t("copiedToast"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailedToast"));
    }
  }

  return (
    <div className="border-border/70 bg-background/70 my-1.5 overflow-hidden rounded-lg border">
      <div className="border-border/60 bg-muted/40 flex items-center justify-between gap-2 border-b px-2.5 py-1">
        <span className="text-muted-foreground text-[11px] font-medium">
          {t("dimensions", { rows: rows.length, cols: headers.length })}
        </span>
        <AppTooltip content={t("copyTooltip")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6"
            aria-label={t("copyTooltip")}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </AppTooltip>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-border/60 bg-muted/70 border-b">
              {headers.map((headerCell, colIdx) => (
                <th
                  key={`th-${colIdx}`}
                  className={cn(
                    "px-2.5 py-1.5 font-semibold whitespace-nowrap",
                    TABLE_ALIGN_CLASSES[alignments[colIdx] ?? "left"],
                  )}
                >
                  {headerCell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={`tr-${rowIdx}`}
                className="border-border/40 hover:bg-muted/30 border-b transition-colors last:border-b-0"
              >
                {row.map((cell, colIdx) => (
                  <td
                    key={`td-${rowIdx}-${colIdx}`}
                    className={cn(
                      "px-2.5 py-1.5 align-top",
                      TABLE_ALIGN_CLASSES[alignments[colIdx] ?? "left"],
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
