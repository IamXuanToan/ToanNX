"use client";

import { cn } from "cn";
import { useFormatter, useLocale, useNow } from "next-intl";

import {
  formatExplicitDateTime,
  formatRelativeTimeLabel,
  parseDateValue,
  type DateInputValue,
} from "@/shares/lib/date-time-format";

/** Props cho component hiển thị mốc thời gian chuẩn `dd/MM/yyyy HH:mm:ss (thời gian đếm)`. */
export type TimestampTextProps = {
  /** Giá trị ngày giờ ISO, timestamp hoặc Date. */
  value: DateInputValue;
  /** Nhãn thay thế phần đếm tương đối (ví dụ: trạng thái đang trực tuyến). */
  statusLabel?: string;
  /** Chuỗi hiển thị khi `value` rỗng/null. */
  fallback?: string;
  /** Class CSS bổ sung cho thẻ `<time>`. */
  className?: string;
  /** Class CSS bổ sung cho phần thời gian đếm trong ngoặc. */
  relativeClassName?: string;
  /** Chỉ hiện phần `dd/MM/yyyy HH:mm:ss`, ẩn phần đếm tương đối nếu cần gọn đặc biệt. */
  hideRelative?: boolean;
};

/**
 * Hiển thị mốc thời gian theo chuẩn hệ thống `dd/MM/yyyy HH:mm:ss (thời gian đếm)`,
 * ví dụ `27/11/2026 13:24:05 (6 giây trước)`.
 * Tự động cập nhật phần đếm tương đối theo `useNow` của `next-intl` và chống lỗi hydration.
 *
 * @param props - Giá trị thời gian, nhãn trạng thái tùy chọn và lớp CSS.
 * @returns Phần tử `<time>` chuẩn ngữ nghĩa hoặc chuỗi fallback.
 */
export function TimestampText({
  value,
  statusLabel,
  fallback = "—",
  className,
  relativeClassName,
  hideRelative = false,
}: TimestampTextProps) {
  const format = useFormatter();
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });
  const parsed = parseDateValue(value);

  if (!parsed) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  const absolute = formatExplicitDateTime(parsed);
  const relative = hideRelative
    ? ""
    : statusLabel?.trim() ||
      formatRelativeTimeLabel(parsed, {
        now,
        locale,
        relativeFormatter:
          typeof format.relativeTime === "function"
            ? (date, baseNow) => format.relativeTime(date, baseNow)
            : undefined,
      });

  return (
    <time
      dateTime={parsed.toISOString()}
      suppressHydrationWarning
      className={cn("tabular-nums", className)}
    >
      <span className="whitespace-nowrap">{absolute}</span>
      {relative ? (
        <span className={cn("text-muted-foreground font-normal", relativeClassName)}>
          {" "}
          ({relative})
        </span>
      ) : null}
    </time>
  );
}
