"use client";

import { cn } from "cn";

import type { ActivityChange } from "@/shares/types/activity-timeline.types";

import { ActivityChangeValue } from "./activity-change-value";

function isWideChange(change: ActivityChange): boolean {
  if (change.added?.length || change.removed?.length) return true;
  if (typeof change.before === "string" && change.before.length > 40) return true;
  if (typeof change.after === "string" && change.after.length > 40) return true;
  return false;
}

/**
 * Hiển thị một mục thay đổi trường dữ liệu theo hai chế độ bố cục:
 * - `"row"`: dòng ngang gọn (`nhãn` trái cố định `sm:w-48` → `giá trị` phải) cho 1–3 thay đổi.
 * - `"cell"`: ô thuộc tính nhỏ gọn trong lưới 2–3 cột cho mốc có nhiều trường, tự span rộng nếu dài/diff mảng.
 *
 * @param props - Dữ liệu trường, cờ tạo mới, chế độ bố cục và số cột của lưới (nếu là `"cell"`).
 * @returns Cặp `<dt>` + `<dd>` biểu diễn thay đổi trường.
 */
export function ActivityChangeRow({
  change,
  isCreation = false,
  variant = "row",
  columns = 3,
}: {
  change: ActivityChange;
  isCreation?: boolean;
  variant?: "row" | "cell";
  columns?: 2 | 3;
}) {
  if (variant === "cell") {
    const wide = isWideChange(change);
    return (
      <div
        className={cn(
          "min-w-0 space-y-1 text-xs",
          wide && (columns === 3 ? "sm:col-span-2 lg:col-span-3" : "md:col-span-2"),
        )}
      >
        <dt className="text-muted-foreground text-[11px] leading-4 font-medium break-words">
          {change.field}
        </dt>
        <dd className="min-w-0 leading-5 break-words">
          <ActivityChangeValue change={change} isCreation={isCreation} />
        </dd>
      </div>
    );
  }

  return (
    <div className="hover:bg-muted/35 flex flex-col gap-1 px-3.5 py-2.5 text-xs transition-colors sm:flex-row sm:items-start sm:gap-4">
      <dt className="text-muted-foreground shrink-0 pt-0.5 font-medium break-words sm:w-48">
        {change.field}
      </dt>
      <dd className="min-w-0 flex-1 break-words">
        <ActivityChangeValue change={change} isCreation={isCreation} />
      </dd>
    </div>
  );
}
