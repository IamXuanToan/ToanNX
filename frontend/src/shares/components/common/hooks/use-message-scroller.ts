"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STICKY_THRESHOLD_PX = 72;

/**
 * Quản lý cuộn tự động xuống cuối luồng chat cho `MessageScroller`
 * kèm phát hiện người dùng đang đọc tin nhắn cũ để hiện nút nhảy xuống cuối.
 *
 * @param watchValue - Khóa thay đổi khi có tin nhắn mới hoặc đang gửi.
 * @returns Ref container, trạng thái đang ở gần cuối và hàm cuộn xuống cuối.
 */
export function useMessageScroller(watchValue: unknown) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const pinnedToBottomRef = useRef(true);

  const checkPosition = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance <= STICKY_THRESHOLD_PX;
    pinnedToBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    pinnedToBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    if (pinnedToBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [watchValue, scrollToBottom]);

  return {
    viewportRef,
    showScrollButton,
    onScroll: checkPosition,
    scrollToBottom,
  };
}
