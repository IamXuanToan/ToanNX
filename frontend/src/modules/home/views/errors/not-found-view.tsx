"use client";

import { NotFoundContent } from "../../components/errors/not-found-content";

/**
 * Trang 404 theo ngôn ngữ (Không tìm thấy trang).
 *
 * @returns Nội dung trang 404.
 */
export function NotFoundView() {
  return <NotFoundContent />;
}
