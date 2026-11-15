import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * Một nhóm trường có tiêu đề (card trắng, viền mảnh, không bóng).
 *
 * @param props - Tiêu đề, phần bên phải tiêu đề và các trường.
 * @returns Card nhóm trường.
 */
export function FormSection({
  title,
  headerAction,
  children,
  className,
}: {
  title: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-card rounded-xl border", className)}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b px-5 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {headerAction}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
