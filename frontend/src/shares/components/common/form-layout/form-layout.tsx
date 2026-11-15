import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * Bố cục hai cột của form: cột chính (các `FormSection` nhập liệu) + cột phụ 22rem bên phải
 * (ảnh, trạng thái, vai trò…). Dưới `lg` hai cột xếp chồng, cột phụ xuống dưới.
 *
 * @param props - Nội dung cột chính và cột phụ.
 * @returns Lưới form.
 */
export function FormLayout({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-6",
        aside ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : undefined,
        className,
      )}
    >
      <div className="min-w-0 space-y-6">{children}</div>
      {aside ? <div className="min-w-0 space-y-6">{aside}</div> : null}
    </div>
  );
}
