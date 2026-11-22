/**
 * Quy đổi (khớp BE `CurrencyConverter`): N = làm_tròn(A × R) tới đồng. Chỉ để xem trước trong form.
 */

const FLOAT_DIGITS = 6;

/**
 * @param original - Số gốc.
 * @param rate - Tỷ giá (VNĐ cho 1 đơn vị).
 * @returns VNĐ đã làm tròn nửa lên (0 khi thiếu số).
 */
export function toVnd(original: string | number, rate: string | number): number {
  const amount = Number(original);
  const value = Number(rate);
  if (!Number.isFinite(amount) || !Number.isFinite(value) || original === "" || rate === "")
    return 0;
  return Math.round(Number((amount * value).toFixed(FLOAT_DIGITS)));
}
