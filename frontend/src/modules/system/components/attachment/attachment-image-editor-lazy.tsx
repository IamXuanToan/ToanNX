"use client";

import dynamic from "next/dynamic";

/**
 * Trình sửa ảnh (cắt, đóng dấu) nạp lười: `react-easy-crop` và canvas chỉ tải khi người dùng bấm Sửa ảnh,
 * không nằm trong bundle của thư viện tệp. Chỉ chạy phía client (cần canvas, `Image`).
 */
export const AttachmentImageEditorLazy = dynamic(
  () => import("./attachment-image-editor").then((module) => module.AttachmentImageEditor),
  { ssr: false },
);
