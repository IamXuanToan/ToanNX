"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import {
  ASSISTANT_LAUNCHER_SIZES,
  ASSISTANT_POPUP_DIMENSIONS,
  ASSISTANT_WIDGET_POSITION_KEY,
  type AssistantLauncherSize,
} from "../../../constants/defaults";
import { useAssistantBotProfile } from "../../../hooks/use-assistant-bot-profile";
import { ASSISTANT_PERMISSIONS } from "../../../permissions/assistant-permission";

type StoredRatio = { xRatio: number; yRatio: number };
type Point = { x: number; y: number };

const EDGE_MARGIN = 16;
const TOP_NAV_CLEARANCE = 76;
const MOBILE_BOTTOM_NAV_CLEARANCE = 76;
const POPUP_GAP = 10;
const DRAG_THRESHOLD_PX = 5;
const DEFAULT_RATIO: StoredRatio = { xRatio: 1, yRatio: 1 };

function resolveLauncherSize(value: unknown): AssistantLauncherSize {
  return value === "sm" || value === "md" || value === "lg" ? value : "md";
}

function isStoredRatio(value: unknown): value is StoredRatio {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.xRatio === "number" &&
    Number.isFinite(candidate.xRatio) &&
    candidate.xRatio >= 0 &&
    candidate.xRatio <= 1 &&
    typeof candidate.yRatio === "number" &&
    Number.isFinite(candidate.yRatio) &&
    candidate.yRatio >= 0 &&
    candidate.yRatio <= 1
  );
}

function subscribeViewport(notify: () => void) {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
}

function getViewportSnapshot() {
  return `${window.innerWidth}x${window.innerHeight}`;
}

function getServerViewportSnapshot() {
  return "1280x800";
}

function clampPoint(x: number, y: number, vw: number, vh: number, buttonSize: number): Point {
  const isMobile = vw < 768;
  const bottomPad = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE : EDGE_MARGIN;
  const maxX = Math.max(EDGE_MARGIN, vw - buttonSize - EDGE_MARGIN);
  const maxY = Math.max(TOP_NAV_CLEARANCE, vh - buttonSize - bottomPad);
  return {
    x: Math.min(maxX, Math.max(EDGE_MARGIN, Math.round(x))),
    y: Math.min(maxY, Math.max(TOP_NAV_CLEARANCE, Math.round(y))),
  };
}

/** Kéo thả xong luôn hít nút tròn sát vào cạnh gần nhất trong 4 cạnh màn hình (chừa header trên). */
function snapToNearestEdge(point: Point, vw: number, vh: number, buttonSize: number): Point {
  const isMobile = vw < 768;
  const bottomPad = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE : EDGE_MARGIN;
  const minX = EDGE_MARGIN;
  const maxX = Math.max(EDGE_MARGIN, vw - buttonSize - EDGE_MARGIN);
  const minY = TOP_NAV_CLEARANCE;
  const maxY = Math.max(TOP_NAV_CLEARANCE, vh - buttonSize - bottomPad);

  const clamped = clampPoint(point.x, point.y, vw, vh, buttonSize);
  const candidates: Array<{ dist: number; point: Point }> = [
    { dist: Math.abs(clamped.x - minX), point: { x: minX, y: clamped.y } },
    { dist: Math.abs(maxX - clamped.x), point: { x: maxX, y: clamped.y } },
    { dist: Math.abs(clamped.y - minY), point: { x: clamped.x, y: minY } },
    { dist: Math.abs(maxY - clamped.y), point: { x: clamped.x, y: maxY } },
  ];
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0]?.point ?? clamped;
}

function ratioToPoint(ratio: StoredRatio, vw: number, vh: number, buttonSize: number): Point {
  const isMobile = vw < 768;
  const bottomPad = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE : EDGE_MARGIN;
  const usableW = Math.max(0, vw - buttonSize - EDGE_MARGIN * 2);
  const usableH = Math.max(0, vh - buttonSize - TOP_NAV_CLEARANCE - bottomPad);
  return clampPoint(
    EDGE_MARGIN + ratio.xRatio * usableW,
    TOP_NAV_CLEARANCE + ratio.yRatio * usableH,
    vw,
    vh,
    buttonSize,
  );
}

function pointToRatio(point: Point, vw: number, vh: number, buttonSize: number): StoredRatio {
  const isMobile = vw < 768;
  const bottomPad = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE : EDGE_MARGIN;
  const usableW = Math.max(1, vw - buttonSize - EDGE_MARGIN * 2);
  const usableH = Math.max(1, vh - buttonSize - TOP_NAV_CLEARANCE - bottomPad);
  return {
    xRatio: Math.min(1, Math.max(0, (point.x - EDGE_MARGIN) / usableW)),
    yRatio: Math.min(1, Math.max(0, (point.y - TOP_NAV_CLEARANCE) / usableH)),
  };
}

/**
 * Điều phối Widget Chatbot AI tròn kéo-thả kiểu Next.js DevTools toàn Client Portal:
 * - Bấm tròn để đóng/mở; kéo > 5px để di chuyển tự do và lưu tỷ lệ vị trí vào `localStorage`.
 * - Kích thước nút tròn (`sm` / `md` / `lg`) đồng bộ từ cấu hình Admin `assistant/bot-profile`.
 * - Tự động tính hướng bung popup (trên/dưới, trái/phải) hướng vào khoảng trống rộng nhất của màn hình.
 *
 * @returns Trạng thái hiển thị, kích cỡ nút tròn, tọa độ popup bung ra và bộ xử lý Pointer Events.
 */
export function useAssistantFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [storedRatio, setStoredRatio] = useStoredPreference<StoredRatio>(
    ASSISTANT_WIDGET_POSITION_KEY,
    DEFAULT_RATIO,
    isStoredRatio,
  );

  const dragMetaRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const viewportRaw = useSyncExternalStore(
    subscribeViewport,
    getViewportSnapshot,
    getServerViewportSnapshot,
  );
  const [vwRaw, vhRaw] = viewportRaw.split("x").map(Number);
  const vw = Number.isFinite(vwRaw) && vwRaw > 0 ? vwRaw : 1280;
  const vh = Number.isFinite(vhRaw) && vhRaw > 0 ? vhRaw : 800;
  const isMobile = vw < 768;

  const { data: currentUser } = useCurrentUser();
  const canChat = usePermission(ASSISTANT_PERMISSIONS.chat);
  const isVisible = Boolean(currentUser) && canChat;

  const profileQuery = useAssistantBotProfile(isVisible);
  const profile = profileQuery.data;
  const launcherSize = resolveLauncherSize(profile?.launcherSize);
  const buttonSize = ASSISTANT_LAUNCHER_SIZES[launcherSize];

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const basePoint = snapToNearestEdge(
    ratioToPoint(storedRatio, vw, vh, buttonSize),
    vw,
    vh,
    buttonSize,
  );
  const activePoint = dragPoint ?? basePoint;

  const bottomPad = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE : EDGE_MARGIN;
  const popupWidth = Math.min(ASSISTANT_POPUP_DIMENSIONS.width, vw - EDGE_MARGIN * 2);
  const spaceAbove = activePoint.y - TOP_NAV_CLEARANCE - POPUP_GAP;
  const spaceBelow = vh - (activePoint.y + buttonSize) - POPUP_GAP - bottomPad;
  const openAbove = spaceAbove >= spaceBelow;
  const openLeft = activePoint.x + buttonSize / 2 >= vw / 2;

  const canOpenSideways =
    !isMobile &&
    Math.max(spaceAbove, spaceBelow) < Math.min(ASSISTANT_POPUP_DIMENSIONS.height, 440) &&
    vw - EDGE_MARGIN * 2 - buttonSize - POPUP_GAP >= popupWidth;

  const rawPopupLeft = canOpenSideways
    ? openLeft
      ? activePoint.x - POPUP_GAP - popupWidth
      : activePoint.x + buttonSize + POPUP_GAP
    : openLeft
      ? activePoint.x + buttonSize - popupWidth
      : activePoint.x;
  const popupLeft = Math.min(
    Math.max(EDGE_MARGIN, vw - popupWidth - EDGE_MARGIN),
    Math.max(EDGE_MARGIN, rawPopupLeft),
  );
  const maxViewportHeight = Math.max(260, vh - TOP_NAV_CLEARANCE - bottomPad);
  const availableVertical = canOpenSideways
    ? maxViewportHeight
    : Math.max(260, openAbove ? spaceAbove : spaceBelow);
  const popupHeight = Math.min(ASSISTANT_POPUP_DIMENSIONS.height, availableVertical);
  const rawPopupTop = canOpenSideways
    ? Math.round(activePoint.y + buttonSize / 2 - popupHeight / 2)
    : openAbove
      ? activePoint.y - POPUP_GAP - popupHeight
      : activePoint.y + buttonSize + POPUP_GAP;
  const popupTop = Math.min(
    Math.max(TOP_NAV_CLEARANCE, vh - bottomPad - popupHeight),
    Math.max(TOP_NAV_CLEARANCE, rawPopupTop),
  );

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* jsdom hoặc trình duyệt không hỗ trợ capture */
      }
    }
    dragMetaRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: activePoint.x,
      originY: activePoint.y,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const meta = dragMetaRef.current;
    if (!meta || meta.pointerId !== event.pointerId) return;
    const dx = event.clientX - meta.startX;
    const dy = event.clientY - meta.startY;
    if (!meta.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    meta.moved = true;
    setDragPoint(clampPoint(meta.originX + dx, meta.originY + dy, vw, vh, buttonSize));
  }

  function finishPointer(event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) {
    const meta = dragMetaRef.current;
    if (!meta || meta.pointerId !== event.pointerId) return;
    dragMetaRef.current = null;
    if (typeof event.currentTarget.releasePointerCapture === "function") {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* Bỏ qua nếu chưa capture */
      }
    }
    if (meta.moved && !cancelled) {
      const dx = event.clientX - meta.startX;
      const dy = event.clientY - meta.startY;
      const landed = snapToNearestEdge(
        clampPoint(meta.originX + dx, meta.originY + dy, vw, vh, buttonSize),
        vw,
        vh,
        buttonSize,
      );
      setStoredRatio(pointToRatio(landed, vw, vh, buttonSize));
      setDragPoint(null);
      return;
    }
    setDragPoint(null);
    if (!cancelled) {
      setIsOpen((prev) => !prev);
    }
  }

  return {
    isVisible,
    isOpen,
    setIsOpen,
    isDragging: Boolean(dragPoint),
    canChat,
    launcherSize,
    assistantName: profile?.name?.trim() || "",
    assistantAvatarUrl: profile?.avatar?.url ?? null,
    placement: `${openAbove ? "top" : "bottom"}-${openLeft ? "left" : "right"}`,
    buttonStyle: {
      left: activePoint.x,
      top: activePoint.y,
      width: buttonSize,
      height: buttonSize,
      touchAction: "none" as const,
    },
    popupStyle: {
      left: popupLeft,
      top: popupTop,
      width: popupWidth,
      height: popupHeight,
    },
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => finishPointer(event, false),
    onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => finishPointer(event, true),
  };
}
