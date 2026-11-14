/**
 * Chuyển đổi khóa camelCase ⇄ snake_case giữa FE và Django.
 *
 * Giới hạn có chủ đích:
 * - Chỉ chuyển khóa của plain object (prototype là Object hoặc null) và mảng.
 * - Không động vào File, Blob, FormData, Date, URLSearchParams, Map/Set hay class instance.
 * - Khóa nằm dưới đường dẫn trong `opaqueKeys` (ví dụ dictionary có nghĩa nghiệp vụ)
 *   được giữ nguyên toàn bộ nội dung.
 */

type ConvertOptions = {
  /** Khóa (đã ở dạng đích) mà giá trị của nó được giữ nguyên, không chuyển đổi bên trong. */
  opaqueKeys?: readonly string[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Đổi một khóa camelCase sang snake_case.
 *
 * @param key - Khóa camelCase.
 * @returns Khóa snake_case.
 */
export function toSnakeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/**
 * Đổi một khóa snake_case sang camelCase.
 *
 * @param key - Khóa snake_case.
 * @returns Khóa camelCase.
 */
export function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function convertKeys(
  value: unknown,
  convert: (key: string) => string,
  options: ConvertOptions,
): unknown {
  if (Array.isArray(value)) return value.map((item) => convertKeys(item, convert, options));
  if (!isPlainObject(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const nextKey = convert(key);
    result[nextKey] = options.opaqueKeys?.includes(nextKey)
      ? item
      : convertKeys(item, convert, options);
  }
  return result;
}

/**
 * Chuyển payload gửi đi sang snake_case.
 *
 * @param value - Payload camelCase.
 * @param options - Tùy chọn giữ nguyên khóa opaque.
 * @returns Payload snake_case.
 */
export function keysToSnake<T = unknown>(value: unknown, options: ConvertOptions = {}): T {
  return convertKeys(value, toSnakeKey, options) as T;
}

/**
 * Chuyển dữ liệu nhận về sang camelCase.
 *
 * @param value - Dữ liệu snake_case.
 * @param options - Tùy chọn giữ nguyên khóa opaque.
 * @returns Dữ liệu camelCase.
 */
export function keysToCamel<T = unknown>(value: unknown, options: ConvertOptions = {}): T {
  return convertKeys(value, toCamelKey, options) as T;
}
