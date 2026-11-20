import { History } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "./empty-state";

/** Một dòng đổi field: nhãn đã dịch, giá trị cũ → mới đã định dạng. */
export type ActivityChange = { field: string; before: ReactNode; after: ReactNode };

/** Một sự kiện trên dòng thời gian. */
export type ActivityItem = {
  id: string;
  /** Thời điểm đã định dạng (tương đối hoặc tuyệt đối). */
  time: ReactNode;
  /** Thời điểm ISO cho `<time dateTime>`. */
  dateTime: string;
  actor: ReactNode;
  /** Hành động đã dịch: "đã tạo", "đã cập nhật", "đã gán vai trò"... */
  action: ReactNode;
  changes: ActivityChange[];
};

/**
 * Dòng thời gian lịch sử thay đổi (chỉ hiển thị). Phần Journal của module system dịch hành động, nhãn field và định dạng
 * giá trị rồi truyền vào; common không gọi API.
 *
 * @param props - Các sự kiện (mới nhất trước) và nội dung khi trống.
 * @returns Danh sách sự kiện.
 */
export function ActivityTimeline({
  items,
  emptyTitle,
}: {
  items: ActivityItem[];
  emptyTitle: ReactNode;
}) {
  if (!items.length) return <EmptyState icon={<History />} title={emptyTitle} />;
  return (
    <div role="list" className="relative space-y-5 border-l pl-5">
      {items.map((item) => (
        <div key={item.id} role="listitem" className="relative">
          <span
            aria-hidden
            className="bg-primary absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full"
          />
          <p className="text-sm">
            <span className="font-medium">{item.actor}</span> {item.action}
          </p>
          <time dateTime={item.dateTime} className="text-muted-foreground text-xs">
            {item.time}
          </time>
          {item.changes.length ? (
            <dl className="bg-muted/50 mt-2 space-y-1 rounded-lg p-2 text-xs">
              {item.changes.map((change) => (
                <div key={change.field} className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
                  <dt className="text-muted-foreground truncate">{change.field}</dt>
                  <dd className="min-w-0 break-words">
                    <span className="text-muted-foreground line-through">{change.before}</span>
                    {" → "}
                    <span>{change.after}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ))}
    </div>
  );
}
