"use client";

import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type TiptapHoveredBlockInfo = {
  index: number;
  top: number;
  height: number;
  totalBlocks: number;
};

export type TiptapDragBlockState = {
  sourceIndex: number;
  sourceTop: number;
  sourceHeight: number;
  dropBeforeIndex: number;
  indicatorTop: number;
};

/** Tìm phạm vi vị trí ProseMirror của khối cấp 1 (con trực tiếp của `doc`) theo chỉ số. */
function getTopLevelBlockRange(editor: Editor, index: number) {
  const { doc } = editor.state;
  if (index < 0 || index >= doc.childCount) return null;
  let offset = 0;
  for (let i = 0; i < index; i += 1) {
    offset += doc.child(i).nodeSize;
  }
  const node = doc.child(index);
  return { from: offset, to: offset + node.nodeSize, node };
}

/**
 * Di chuyển khối cấp 1 từ `sourceIndex` sang vị trí chèn trước `dropBeforeIndex`
 * trong một transaction duy nhất (hoàn tác 1 bước bằng Ctrl+Z).
 */
export function moveTopLevelBlock(
  editor: Editor,
  sourceIndex: number,
  dropBeforeIndex: number,
): boolean {
  const { doc } = editor.state;
  if (
    sourceIndex < 0 ||
    sourceIndex >= doc.childCount ||
    dropBeforeIndex < 0 ||
    dropBeforeIndex > doc.childCount
  ) {
    return false;
  }
  if (dropBeforeIndex === sourceIndex || dropBeforeIndex === sourceIndex + 1) {
    return false;
  }

  const source = getTopLevelBlockRange(editor, sourceIndex);
  if (!source) return false;
  const nodeToMove = source.node;
  const tr = editor.state.tr;
  let insertPos = 0;

  if (dropBeforeIndex < sourceIndex) {
    const target = getTopLevelBlockRange(editor, dropBeforeIndex);
    if (!target) return false;
    insertPos = target.from;
    tr.delete(source.from, source.to);
    tr.insert(insertPos, nodeToMove);
  } else {
    const rawTargetPos =
      dropBeforeIndex >= doc.childCount
        ? doc.content.size
        : (getTopLevelBlockRange(editor, dropBeforeIndex)?.from ?? doc.content.size);
    tr.delete(source.from, source.to);
    insertPos = tr.mapping.map(rawTargetPos);
    tr.insert(insertPos, nodeToMove);
  }

  const resolvedPos = Math.min(insertPos + 1, tr.doc.content.size);
  tr.setSelection(TextSelection.near(tr.doc.resolve(resolvedPos)));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}

/** Tính toán vị trí chèn giữa các khối khi kéo chuột/ngón tay dọc theo editor. */
function resolveDropSlot(
  prose: HTMLElement,
  canvasRect: DOMRect,
  clientY: number,
): { dropBeforeIndex: number; indicatorTop: number } | null {
  const children = Array.from(prose.children) as HTMLElement[];
  if (children.length === 0) return null;

  for (let i = 0; i < children.length; i += 1) {
    const rect = children[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return {
        dropBeforeIndex: i,
        indicatorTop: Math.max(0, Math.round(rect.top - canvasRect.top - 2)),
      };
    }
  }

  const lastRect = children[children.length - 1].getBoundingClientRect();
  return {
    dropBeforeIndex: children.length,
    indicatorTop: Math.max(0, Math.round(lastRect.bottom - canvasRect.top + 2)),
  };
}

/**
 * Hook quản lý thanh điều khiển khối (`+` và `⠿` giống Notion) có kéo thả sắp xếp lại vị trí dòng
 * trực tiếp bằng con trỏ chuột hoặc cảm ứng, kèm menu thao tác khi nhấp nhanh vào `⠿`.
 */
export function useTiptapBlockHandle(editor: Editor | null, enabled: boolean) {
  const [hoveredBlock, setHoveredBlock] = useState<TiptapHoveredBlockInfo | null>(null);
  const [dragState, setDragState] = useState<TiptapDragBlockState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const gripDragRef = useRef<{
    pointerId: number;
    sourceIndex: number;
    sourceTop: number;
    sourceHeight: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
    dropBeforeIndex: number;
    indicatorTop: number;
    canvasEl: HTMLElement;
    proseEl: HTMLElement;
  } | null>(null);

  // Theo dõi khối đang đặt con trỏ trên màn hình cảm ứng / khi điều hướng bằng bàn phím
  useEffect(() => {
    if (!editor || !enabled) return;

    const syncFocusedBlock = () => {
      if (!editor.isEditable || !editor.isFocused || gripDragRef.current || menuOpen) return;
      const prose = editor.view.dom as HTMLElement;
      const canvas = prose.closest("[data-tiptap-canvas]") as HTMLElement | null;
      if (!canvas) return;
      const children = Array.from(prose.children) as HTMLElement[];
      if (children.length === 0) return;

      const { $from } = editor.state.selection;
      const topDepthIndex = $from.depth >= 1 ? $from.index(0) : 0;
      const clampedIndex = Math.max(0, Math.min(topDepthIndex, children.length - 1));
      const rect = children[clampedIndex].getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const top = Math.max(0, Math.round(rect.top - canvasRect.top + 4));
      const height = Math.max(24, Math.round(rect.height));

      setHoveredBlock((prev) =>
        prev &&
        prev.index === clampedIndex &&
        prev.top === top &&
        prev.height === height &&
        prev.totalBlocks === children.length
          ? prev
          : { index: clampedIndex, top, height, totalBlocks: children.length },
      );
    };

    editor.on("selectionUpdate", syncFocusedBlock);
    return () => {
      editor.off("selectionUpdate", syncFocusedBlock);
    };
  }, [editor, enabled, menuOpen]);

  const handleCanvasMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!enabled || !editor || !editor.isEditable || menuOpen || gripDragRef.current) return;
    const container = event.currentTarget;
    const prose = container.querySelector(".ProseMirror");
    if (!prose) return;
    const children = Array.from(prose.children) as HTMLElement[];
    if (children.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const pointerY = event.clientY;
    let matchedIndex = -1;

    for (let i = 0; i < children.length; i += 1) {
      const rect = children[i].getBoundingClientRect();
      if (pointerY >= rect.top - 8 && pointerY <= rect.bottom + 8) {
        matchedIndex = i;
        break;
      }
    }
    if (matchedIndex === -1) return;

    const targetRect = children[matchedIndex].getBoundingClientRect();
    const top = Math.max(0, Math.round(targetRect.top - containerRect.top + 4));
    const height = Math.max(24, Math.round(targetRect.height));
    setHoveredBlock((prev) =>
      prev &&
      prev.index === matchedIndex &&
      prev.top === top &&
      prev.height === height &&
      prev.totalBlocks === children.length
        ? prev
        : { index: matchedIndex, top, height, totalBlocks: children.length },
    );
  };

  const handleCanvasMouseLeave = () => {
    if (!menuOpen && !gripDragRef.current) setHoveredBlock(null);
  };

  const handleGripPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!enabled || !editor || !editor.isEditable || !hoveredBlock) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    event.stopPropagation();

    const canvasEl = event.currentTarget.closest("[data-tiptap-canvas]") as HTMLElement | null;
    const proseEl = canvasEl?.querySelector(".ProseMirror") as HTMLElement | null;
    if (!canvasEl || !proseEl) return;

    const children = Array.from(proseEl.children) as HTMLElement[];
    const sourceEl = children[hoveredBlock.index];
    if (!sourceEl) return;

    const canvasRect = canvasEl.getBoundingClientRect();
    const sourceRect = sourceEl.getBoundingClientRect();
    const sourceTop = Math.max(0, Math.round(sourceRect.top - canvasRect.top));
    const sourceHeight = Math.max(24, Math.round(sourceRect.height));

    gripDragRef.current = {
      pointerId: event.pointerId,
      sourceIndex: hoveredBlock.index,
      sourceTop,
      sourceHeight,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
      dropBeforeIndex: hoveredBlock.index,
      indicatorTop: sourceTop,
      canvasEl,
      proseEl,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGripPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = gripDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.hasMoved) {
      const dist = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (dist < 5) return;
      drag.hasMoved = true;
      setMenuOpen(false);
    }

    const canvasRect = drag.canvasEl.getBoundingClientRect();
    const slot = resolveDropSlot(drag.proseEl, canvasRect, event.clientY);
    if (!slot) return;

    drag.dropBeforeIndex = slot.dropBeforeIndex;
    drag.indicatorTop = slot.indicatorTop;

    setDragState({
      sourceIndex: drag.sourceIndex,
      sourceTop: drag.sourceTop,
      sourceHeight: drag.sourceHeight,
      dropBeforeIndex: slot.dropBeforeIndex,
      indicatorTop: slot.indicatorTop,
    });
  };

  const finishGripPointer = (event: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const drag = gripDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const { hasMoved, sourceIndex, dropBeforeIndex } = drag;
    gripDragRef.current = null;
    setDragState(null);

    if (cancelled) return;
    if (!hasMoved) {
      setMenuOpen((prev) => !prev);
      return;
    }

    if (editor && moveTopLevelBlock(editor, sourceIndex, dropBeforeIndex)) {
      const prose = editor.view.dom as HTMLElement;
      const canvas = prose.closest("[data-tiptap-canvas]") as HTMLElement | null;
      const children = Array.from(prose.children) as HTMLElement[];
      const targetIdx = dropBeforeIndex > sourceIndex ? dropBeforeIndex - 1 : dropBeforeIndex;
      const targetEl = children[Math.max(0, Math.min(targetIdx, children.length - 1))];
      if (canvas && targetEl) {
        const cRect = canvas.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        setHoveredBlock({
          index: Math.max(0, Math.min(targetIdx, children.length - 1)),
          top: Math.max(0, Math.round(tRect.top - cRect.top + 4)),
          height: Math.max(24, Math.round(tRect.height)),
          totalBlocks: children.length,
        });
      }
    }
  };

  const insertBlockBelow = (index: number) => {
    if (!editor) return;
    const info = getTopLevelBlockRange(editor, index);
    if (!info) return;
    editor
      .chain()
      .focus()
      .insertContentAt(info.to, { type: "paragraph", content: [{ type: "text", text: "/" }] })
      .setTextSelection(info.to + 2)
      .run();
    setMenuOpen(false);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (!editor) return;
    const targetDropBefore = direction < 0 ? index - 1 : index + 2;
    moveTopLevelBlock(editor, index, targetDropBefore);
    setMenuOpen(false);
  };

  const duplicateBlock = (index: number) => {
    if (!editor) return;
    const info = getTopLevelBlockRange(editor, index);
    if (!info) return;
    editor.chain().focus().insertContentAt(info.to, info.node.toJSON()).run();
    setMenuOpen(false);
  };

  const deleteBlock = (index: number) => {
    if (!editor) return;
    const info = getTopLevelBlockRange(editor, index);
    if (!info) return;
    const chain = editor.chain().focus().deleteRange({ from: info.from, to: info.to });
    if (editor.state.doc.childCount <= 1) {
      chain.insertContent({ type: "paragraph" });
    }
    chain.run();
    setMenuOpen(false);
    setHoveredBlock(null);
  };

  const turnBlockInto = (
    index: number,
    kind: "paragraph" | "h1" | "h2" | "h3" | "bulletList" | "orderedList" | "blockquote",
  ) => {
    if (!editor) return;
    const info = getTopLevelBlockRange(editor, index);
    if (!info) return;
    const insidePos = Math.min(info.from + 1, editor.state.doc.content.size);
    const chain = editor.chain().focus().setTextSelection(insidePos);
    switch (kind) {
      case "paragraph":
        chain.setParagraph().run();
        break;
      case "h1":
        chain.setHeading({ level: 1 }).run();
        break;
      case "h2":
        chain.setHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.setHeading({ level: 3 }).run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "blockquote":
        chain.toggleBlockquote().run();
        break;
    }
    setMenuOpen(false);
  };

  return {
    hoveredBlock,
    dragState,
    menuOpen,
    setMenuOpen,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    handleGripPointerDown,
    handleGripPointerMove,
    handleGripPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) =>
      finishGripPointer(event, false),
    handleGripPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) =>
      finishGripPointer(event, true),
    insertBlockBelow,
    moveBlock,
    duplicateBlock,
    deleteBlock,
    turnBlockInto,
  };
}
