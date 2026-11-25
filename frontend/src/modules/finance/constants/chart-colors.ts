/**
 * Bảng màu biểu đồ đa sắc theo token `--chart-1..8` trong `globals.css`
 * (bắt đầu bằng xanh lá thương hiệu, các màu tách sắc độ rõ ràng cho Light/Dark và xoay vòng khi nhiều nhóm hơn 8).
 */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

/** @param index - Thứ tự. @returns Màu token. */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
