"use client";

import { ArrowRight, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import type { ActivityChange } from "@/shares/types/activity-timeline.types";

function isBlankValue(value: ActivityChange["before"]): boolean {
  return value === "—" || value === "" || value === null || value === undefined;
}

function isJsonLike(value: ActivityChange["after"]): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    (trimmed.startsWith("{") && trimmed.includes(":")) ||
    (trimmed.startsWith("[") && trimmed.length > 24)
  );
}

/**
 * Hiển thị phần giá trị của một thay đổi trường dữ liệu:
 * - Mảng có diff (`added`/`removed`): các badge `+ thêm` / `- bỏ`.
 * - Khởi tạo (`isCreation` với `before` trống): chữ sạch gọn không đóng khung pill rườm rà;
 *   riêng chuỗi JSON dài hiển thị bằng khối mono dễ đọc.
 * - Cập nhật (`before → after`): tách trực quan giá trị cũ (gạch ngang) → giá trị mới (nổi bật).
 *
 * @param props - Thông tin thay đổi trường và cờ khởi tạo.
 * @returns Phần tử ReactNode hiển thị giá trị.
 */
export function ActivityChangeValue({
  change,
  isCreation = false,
}: {
  change: ActivityChange;
  isCreation?: boolean;
}) {
  const t = useTranslations("common.timeline");
  const hasListDiff = Boolean(change.added?.length || change.removed?.length);
  const beforeEmpty = isBlankValue(change.before);
  const afterEmpty = isBlankValue(change.after);

  if (hasListDiff) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {change.added?.map((item, idx) => (
          <Badge
            key={`add-${idx}`}
            variant="outline"
            className="border-success/30 bg-success-bg text-success gap-1 rounded-md px-1.5 py-0.5 font-normal break-all"
          >
            <Plus className="size-3 shrink-0" />
            <span>{item}</span>
          </Badge>
        ))}
        {change.removed?.map((item, idx) => (
          <Badge
            key={`rem-${idx}`}
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive gap-1 rounded-md px-1.5 py-0.5 font-normal break-all line-through"
          >
            <Minus className="size-3 shrink-0" />
            <span>{item}</span>
          </Badge>
        ))}
      </div>
    );
  }

  if (isCreation && beforeEmpty) {
    if (afterEmpty) {
      return <span className="text-muted-foreground font-normal italic">{t("emptyValue")}</span>;
    }
    if (isJsonLike(change.after)) {
      return (
        <code className="border-border/60 bg-background/70 text-foreground/90 block max-w-full rounded-lg border px-2.5 py-1.5 font-mono text-[11px] leading-relaxed break-all">
          {change.after}
        </code>
      );
    }
    return <span className="text-foreground font-medium break-words">{change.after}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {beforeEmpty ? (
        <span className="text-muted-foreground/80 italic">{t("emptyValue")}</span>
      ) : (
        <span className="bg-destructive/10 text-destructive decoration-destructive/60 inline-block max-w-full rounded-md px-1.5 py-0.5 break-words line-through">
          {change.before}
        </span>
      )}
      <ArrowRight aria-hidden className="text-muted-foreground/70 size-3.5 shrink-0" />
      {afterEmpty ? (
        <span className="text-muted-foreground/80 italic">{t("emptyValue")}</span>
      ) : (
        <span className="bg-success-bg text-success inline-block max-w-full rounded-md px-2 py-0.5 font-medium break-words">
          {change.after}
        </span>
      )}
    </div>
  );
}
