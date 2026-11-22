import { cn } from "cn";
import type { ReactNode } from "react";

import { Badge } from "@/shares/components/ui/badge";

/** Sắc thái trạng thái. */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary-light text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-destructive/10 text-destructive",
};

/**
 * Badge trạng thái chuẩn theo sắc thái (màu lấy token, không hardcode): trung tính, thông tin,
 * thành công, cảnh báo, nguy hiểm. Mọi cột/ô trạng thái chỉ đọc dùng component này.
 *
 * @param props - Nội dung, sắc thái và class thêm.
 * @returns Badge trạng thái.
 */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return <Badge className={cn(TONE_CLASS[tone], className)}>{children}</Badge>;
}
