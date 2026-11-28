"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import { useSubmitPublicFeedback } from "../../../hooks/use-submit-public-feedback";
import {
  createPublicFeedbackFormSchema,
  type PublicFeedbackFormValues,
} from "../../../schemas/page-feedback.schema";
import type { PageFeedbackTargetType } from "../../../types/page-feedback.types";

type StoredRatio = { xRatio: number; yRatio: number };
type Point = { x: number; y: number };

const POSITION_KEY = "feedback_widget_position";
const BUTTON_SIZE = 48;
const EDGE_MARGIN = 16;
const POPUP_GAP = 10;
const DRAG_THRESHOLD_PX = 5;
const DEFAULT_RATIO: StoredRatio = { xRatio: 1, yRatio: 1 };

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

function clampPoint(x: number, y: number, vw: number, vh: number): Point {
  const maxX = Math.max(EDGE_MARGIN, vw - BUTTON_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, vh - BUTTON_SIZE - EDGE_MARGIN);
  return {
    x: Math.min(maxX, Math.max(EDGE_MARGIN, Math.round(x))),
    y: Math.min(maxY, Math.max(EDGE_MARGIN, Math.round(y))),
  };
}

function ratioToPoint(ratio: StoredRatio, vw: number, vh: number): Point {
  const maxX = Math.max(EDGE_MARGIN, vw - BUTTON_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, vh - BUTTON_SIZE - EDGE_MARGIN);
  const usableW = Math.max(0, maxX - EDGE_MARGIN);
  const usableH = Math.max(0, maxY - EDGE_MARGIN);
  return clampPoint(
    EDGE_MARGIN + ratio.xRatio * usableW,
    EDGE_MARGIN + ratio.yRatio * usableH,
    vw,
    vh,
  );
}

function pointToRatio(point: Point, vw: number, vh: number): StoredRatio {
  const maxX = Math.max(EDGE_MARGIN, vw - BUTTON_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, vh - BUTTON_SIZE - EDGE_MARGIN);
  const usableW = Math.max(1, maxX - EDGE_MARGIN);
  const usableH = Math.max(1, maxY - EDGE_MARGIN);
  return {
    xRatio: Math.min(1, Math.max(0, (point.x - EDGE_MARGIN) / usableW)),
    yRatio: Math.min(1, Math.max(0, (point.y - EDGE_MARGIN) / usableH)),
  };
}

function snapToNearestEdge(point: Point, vw: number, vh: number): Point {
  const clamped = clampPoint(point.x, point.y, vw, vh);
  const maxX = Math.max(EDGE_MARGIN, vw - BUTTON_SIZE - EDGE_MARGIN);
  return {
    x: clamped.x + BUTTON_SIZE / 2 < vw / 2 ? EDGE_MARGIN : maxX,
    y: clamped.y,
  };
}

/**
 * State cho nút nổi kéo-thả + popup góp ý ẩn danh trên Custom Page và ShortLink công khai.
 *
 * @param options - Ngữ cảnh trang hoặc link đang xem.
 * @returns State mở/đóng popup, vị trí kéo-thả, form RHF và handler gửi góp ý.
 */
export function usePublicFeedbackWidget({
  targetType,
  targetId,
  slug,
  targetTitle,
}: {
  targetType: PageFeedbackTargetType;
  targetId?: string;
  slug?: string;
  targetTitle?: string;
}) {
  const t = useTranslations("utilities.publicFeedback");
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [storedRatio, setStoredRatio] = useStoredPreference<StoredRatio>(
    POSITION_KEY,
    DEFAULT_RATIO,
    isStoredRatio,
  );
  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const activePoint = dragPoint ?? snapToNearestEdge(ratioToPoint(storedRatio, vw, vh), vw, vh);

  const popupWidth = Math.min(420, Math.max(280, vw - EDGE_MARGIN * 2));
  const spaceAbove = activePoint.y - EDGE_MARGIN - POPUP_GAP;
  const spaceBelow = vh - (activePoint.y + BUTTON_SIZE) - POPUP_GAP - EDGE_MARGIN;
  const openAbove = spaceAbove >= spaceBelow;
  const openLeft = activePoint.x + BUTTON_SIZE / 2 >= vw / 2;

  const rawPopupLeft = openLeft ? activePoint.x + BUTTON_SIZE - popupWidth : activePoint.x;
  const popupLeft = Math.min(
    Math.max(EDGE_MARGIN, vw - popupWidth - EDGE_MARGIN),
    Math.max(EDGE_MARGIN, rawPopupLeft),
  );
  const maxPopupHeight = Math.min(560, Math.max(280, openAbove ? spaceAbove : spaceBelow));
  const popupTop = openAbove ? undefined : activePoint.y + BUTTON_SIZE + POPUP_GAP;
  const popupBottom = openAbove ? vh - activePoint.y + POPUP_GAP : undefined;

  const buttonStyle: CSSProperties = {
    left: activePoint.x,
    top: activePoint.y,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  };

  const popupStyle: CSSProperties = {
    left: popupLeft,
    ...(popupTop !== undefined ? { top: popupTop } : { bottom: popupBottom }),
    width: popupWidth,
    maxHeight: maxPopupHeight,
  };

  const schema = useMemo(
    () =>
      createPublicFeedbackFormSchema({
        messageMin: t("validation.messageMin"),
        messageMax: t("validation.messageMax"),
        emailInvalid: t("validation.emailInvalid"),
      }),
    [t],
  );

  const mutation = useSubmitPublicFeedback();

  const form = useForm<PublicFeedbackFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      feedbackType: "BROKEN_LINK",
      message: "",
      senderName: "",
      senderEmail: "",
      website: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "https://toannx.com";
    await mutation.mutateAsync({
      targetType,
      targetId: targetId || undefined,
      slug: slug || undefined,
      targetUrl: currentUrl,
      targetTitle: targetTitle || undefined,
      feedbackType: values.feedbackType,
      message: values.message,
      senderName: values.senderName || undefined,
      senderEmail: values.senderEmail || undefined,
      website: values.website || undefined,
    });
    setSubmitted(true);
    toast.success(t("submittedToast"));
    form.reset({
      feedbackType: "BROKEN_LINK",
      message: "",
      senderName: "",
      senderEmail: "",
      website: "",
    });
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSubmitted(false);
  };

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
    setIsDragging(true);
    setDragPoint(clampPoint(meta.originX + dx, meta.originY + dy, vw, vh));
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) {
    const meta = dragMetaRef.current;
    if (!meta || meta.pointerId !== event.pointerId) return;
    dragMetaRef.current = null;
    if (typeof event.currentTarget.hasPointerCapture === "function") {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* bỏ qua lỗi release */
      }
    }
    if (meta.moved) {
      const dx = event.clientX - meta.startX;
      const dy = event.clientY - meta.startY;
      const snapped = snapToNearestEdge(
        clampPoint(meta.originX + dx, meta.originY + dy, vw, vh),
        vw,
        vh,
      );
      setStoredRatio(pointToRatio(snapped, vw, vh));
      setDragPoint(null);
      setIsDragging(false);
      return;
    }
    setDragPoint(null);
    setIsDragging(false);
    if (!cancelled) {
      handleOpenChange(!open);
    }
  }

  return {
    open,
    setOpen: handleOpenChange,
    submitted,
    setSubmitted,
    form,
    submit,
    isPending: mutation.isPending,
    isDragging,
    buttonStyle,
    popupStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => finishDrag(e, false),
    onPointerCancel: (e: ReactPointerEvent<HTMLButtonElement>) => finishDrag(e, true),
  };
}
