"use client";

import type { NodeViewProps } from "@tiptap/react";
import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";

import type { TiptapImageAlign } from "../tiptap-extensions";

/**
 * State & handler cho NodeView ảnh Tiptap: kéo thả đổi kích thước, căn lề (trái/giữa/phải/full),
 * chỉnh nhanh mức %, sửa văn bản mô tả (alt) và xóa node ảnh.
 *
 * @param props - Props của NodeView từ Tiptap.
 * @returns Trạng thái và callback điều khiển ảnh.
 */
export function useTiptapImageNode(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected, editor } = props;

  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const rawAlign = typeof node.attrs.align === "string" ? node.attrs.align : null;
  const align = (rawAlign as TiptapImageAlign | null) ?? "left";
  const widthAttr = node.attrs.width as string | number | null | undefined;

  const [draftPercent, setDraftPercent] = useState<number | null>(null);
  const [failedForSrc, setFailedForSrc] = useState<string | null>(null);
  const imgFailed = failedForSrc === src;
  const [altOpen, setAltOpen] = useState(false);
  const [altDraft, setAltDraft] = useState(alt);

  const dragData = useRef<{
    pointerId: number;
    edge: "left" | "right";
    startX: number;
    startWidth: number;
    containerWidth: number;
    lastPercent: number;
  } | null>(null);

  const computePercentFromDrag = (
    edge: "left" | "right",
    dx: number,
    startWidth: number,
    containerWidth: number,
  ) => {
    const scaleFactor = align === "center" ? 2 : 1;
    const signedDelta = edge === "right" ? dx * scaleFactor : -dx * scaleFactor;
    const nextPx = Math.max(
      Math.min(startWidth + signedDelta, containerWidth),
      containerWidth * 0.15,
    );
    return Math.max(15, Math.min(100, Math.round((nextPx / containerWidth) * 100)));
  };

  const handleResizeStart =
    (edge: "left" | "right") => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!editor.isEditable) return;
      event.preventDefault();
      event.stopPropagation();

      const wrap = event.currentTarget.closest("figure");
      if (!wrap) return;
      const prose = wrap.closest(".ProseMirror") as HTMLElement | null;
      const proseWidth = prose ? prose.clientWidth - 32 : wrap.parentElement?.clientWidth;
      const containerWidth = Math.max(200, proseWidth || 600);
      const startWidth = wrap.getBoundingClientRect().width || containerWidth;
      const initialPercent = Math.max(
        15,
        Math.min(100, Math.round((startWidth / containerWidth) * 100)),
      );

      dragData.current = {
        pointerId: event.pointerId,
        edge,
        startX: event.clientX,
        startWidth,
        containerWidth,
        lastPercent: initialPercent,
      };
      setDraftPercent(initialPercent);
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  const handleResizeMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragData.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const pct = computePercentFromDrag(
      drag.edge,
      event.clientX - drag.startX,
      drag.startWidth,
      drag.containerWidth,
    );
    drag.lastPercent = pct;
    setDraftPercent(pct);
  };

  const handleResizeEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragData.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const finalPct = drag.lastPercent;
    dragData.current = null;
    setDraftPercent(null);

    updateAttributes({
      width: `${finalPct}%`,
      ...(rawAlign === "full" && finalPct < 100 ? { align: "center" } : {}),
    });
  };

  const handleSetAlign = (nextAlign: TiptapImageAlign) => {
    if (!editor.isEditable) return;
    if (nextAlign === "full") {
      updateAttributes({ align: "full", width: "100%" });
      return;
    }
    const shouldScaleDownFromFull = rawAlign === "full" && (!widthAttr || widthAttr === "100%");
    updateAttributes({
      align: nextAlign,
      ...(shouldScaleDownFromFull ? { width: "75%" } : {}),
    });
  };

  const handleSetWidthPreset = (preset: string) => {
    if (!editor.isEditable) return;
    updateAttributes({
      width: preset,
      ...(preset !== "100%" && rawAlign === "full" ? { align: "center" } : {}),
    });
  };

  const handleSaveAlt = () => {
    updateAttributes({ alt: altDraft.trim() || null });
    setAltOpen(false);
  };

  return {
    src,
    alt,
    align,
    rawAlign,
    widthAttr,
    draftPercent,
    isDragging: draftPercent !== null,
    selected,
    editable: editor.isEditable,
    imgFailed,
    markFailed: () => setFailedForSrc(src),
    altOpen,
    setAltOpen: (open: boolean) => {
      if (open) setAltDraft(alt);
      setAltOpen(open);
    },
    altDraft,
    setAltDraft,
    handleSaveAlt,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleSetAlign,
    handleSetWidthPreset,
    handleDelete: deleteNode,
  };
}
