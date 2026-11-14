import { useMediaQuery } from "./use-media-query";

const MOBILE_BREAKPOINT = 768;

/**
 * Màn hình đang ở kích thước mobile (dùng bởi Sidebar để chuyển sang drawer).
 *
 * @returns True nếu nhỏ hơn 768px.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
