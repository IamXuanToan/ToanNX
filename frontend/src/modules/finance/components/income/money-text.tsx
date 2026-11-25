import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";

/**
 * Số tiền chỉ đọc (VNĐ mặc định, ngoại tệ theo mã); `null` hiện "—".
 *
 * @param props - Giá trị, mã tiền tệ, số lẻ.
 * @returns Chuỗi tiền.
 */
export function MoneyText({
  value,
  currency = DEFAULT_CURRENCY,
  decimals,
  className,
}: {
  value: string | number | null | undefined;
  currency?: string;
  decimals?: number;
  className?: string;
}) {
  if (value === null || value === undefined || value === "")
    return <span className={className}>—</span>;
  return (
    <span className={className ? `tabular-nums ${className}` : "tabular-nums"}>
      {formatDisplayMoney(value, {
        currency,
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
    </span>
  );
}
