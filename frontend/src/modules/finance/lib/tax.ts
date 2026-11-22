/**
 * Công thức khấu trừ (khớp BE `TaxWithholdingCalculator`): số vào tài khoản đã trừ thuế,
 * T = làm_tròn(N × r / (100 − r)), G = N + T. Chỉ để xem trước trong form; số chính thức do BE tính.
 */

const PERCENT = 100;
/** Bỏ sai số float trước khi làm tròn nửa lên (vd. 52631,5789… không bị lệch). */
const FLOAT_DIGITS = 6;

/** Làm tròn nửa lên tới đồng sau khi cắt sai số float. */
function roundHalfUp(value: number): number {
  return Math.round(Number(value.toFixed(FLOAT_DIGITS)));
}

/**
 * @param amount - VNĐ thực nhận.
 * @param rate - % khấu trừ.
 * @returns Tiền thuế đã bị khấu trừ.
 */
export function withheldTax(amount: number, rate: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0 || rate >= PERCENT) return 0;
  return roundHalfUp((amount * rate) / (PERCENT - rate));
}

/** @returns Thu nhập trước khấu trừ G = N + T. */
export function grossAmount(amount: number, rate: number): number {
  return Math.round(amount) + withheldTax(amount, rate);
}
