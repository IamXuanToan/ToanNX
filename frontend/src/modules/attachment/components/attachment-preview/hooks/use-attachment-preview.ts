"use client";

import { useState } from "react";

/** @returns Trạng thái lỗi ảnh; component được đặt key theo id để đổi file không giữ lỗi cũ. */
export function useAttachmentPreview() {
  const [failed, setFailed] = useState(false);
  return { failed, onError: () => setFailed(true) };
}
