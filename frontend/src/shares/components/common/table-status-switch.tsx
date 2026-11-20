"use client";

import { Badge } from "@/shares/components/ui/badge";
import { Switch } from "@/shares/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

/**
 * Ô trạng thái bật/tắt chuẩn trong bảng (khoá/mở tài khoản, bật/tắt vai trò…).
 * Có quyền đổi: **chỉ một công tắc** (vị trí công tắc đã nói trạng thái; nhãn nằm ở tooltip và
 * `aria-label`), không kèm chữ bên cạnh. Không có quyền (`onCheckedChange` trống): chỉ badge.
 * Thao tác đổi trạng thái đặt ở cột riêng này, không ghép vào cột Thao tác.
 *
 * @param props - Trạng thái, nhãn hai trạng thái, callback và trạng thái khoá.
 * @returns Ô trạng thái.
 */
export function TableStatusSwitch({
  checked,
  onLabel,
  offLabel,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onLabel: string;
  offLabel: string;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Tên thao tác khi bấm (ví dụ "Khoá tài khoản"). */
  "aria-label": string;
}) {
  const label = checked ? onLabel : offLabel;
  if (!onCheckedChange) {
    return <Badge variant={checked ? "success" : "destructive"}>{label}</Badge>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Switch
            checked={checked}
            disabled={disabled}
            aria-label={`${ariaLabel} (${label})`}
            onCheckedChange={onCheckedChange}
            onDoubleClick={(event) => event.stopPropagation()}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
