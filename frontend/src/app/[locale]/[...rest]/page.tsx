import { notFound } from "next/navigation";

/**
 * Route bắt mọi đường dẫn không tồn tại trong locale hiện tại:
 * Gọi `notFound()` để kích hoạt `not-found.tsx` tương ứng với ngôn ngữ của URL.
 */
export default function CatchAllPage() {
  notFound();
}
