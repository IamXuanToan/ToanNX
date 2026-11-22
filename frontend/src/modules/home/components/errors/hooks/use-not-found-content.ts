"use client";

import { useRouter } from "@/i18n/navigation";

import { HOME_ROUTES } from "../../../constants/routes";

/**
 * Nút "Quay lại" của trang 404: có lịch sử thì lùi một trang, không có thì về trang chủ.
 *
 * @returns Hàm `handleBack`.
 */
export function useNotFoundContent() {
  const router = useRouter();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(HOME_ROUTES.home);
    }
  };
  return { handleBack };
}
