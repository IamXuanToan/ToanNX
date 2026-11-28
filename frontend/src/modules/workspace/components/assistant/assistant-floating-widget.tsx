"use client";

import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import { cn } from "cn";

import { AssistantAvatar } from "./assistant-avatar";
import { AssistantChat } from "./assistant-chat";
import { useAssistantFloatingWidget } from "./hooks/use-assistant-floating-widget";

/**
 * Nút tròn Chatbot AI kéo-thả toàn Portal:
 * - Bấm để bật/tắt popup chat 1 luồng tự tính hướng bung ra phía trong khung nhìn (giống Next.js DevTools).
 * - Kích thước nút tròn (`sm` / `md` / `lg`) theo cấu hình chung từ Admin (`/quan-tri/he-thong/tro-ly-ai`).
 *
 * @returns Nút tròn kéo-thả & Popup Trợ lý AI khi mở.
 */
export function AssistantFloatingWidget() {
  const t = useTranslations("workspace.assistant");
  const widget = useAssistantFloatingWidget();

  if (!widget.isVisible) {
    return null;
  }

  const displayName = widget.assistantName || t("defaultName");

  return (
    <>
      {widget.isOpen ? (
        <section
          aria-label={displayName}
          data-testid="assistant-popup-panel"
          data-placement={widget.placement}
          style={widget.popupStyle}
          className={cn(
            "border-border/80 bg-card fixed z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl",
            widget.isResizing && "select-none",
          )}
        >
          <div
            aria-hidden
            data-testid="assistant-resize-horizontal"
            onPointerDown={(event) => widget.onResizePointerDown("x", event)}
            onPointerMove={widget.onResizePointerMove}
            onPointerUp={widget.onResizePointerUp}
            onPointerCancel={widget.onResizePointerCancel}
            className={cn(
              "hover:bg-primary/40 absolute inset-y-3 z-20 hidden w-1.5 cursor-ew-resize touch-none transition-colors md:block",
              widget.horizontalResizeEdge === "left" ? "left-0" : "right-0",
            )}
          />
          <div
            aria-hidden
            data-testid="assistant-resize-vertical"
            onPointerDown={(event) => widget.onResizePointerDown("y", event)}
            onPointerMove={widget.onResizePointerMove}
            onPointerUp={widget.onResizePointerUp}
            onPointerCancel={widget.onResizePointerCancel}
            className={cn(
              "hover:bg-primary/40 absolute inset-x-3 z-20 hidden h-1.5 cursor-ns-resize touch-none transition-colors md:block",
              widget.verticalResizeEdge === "top" ? "top-0" : "bottom-0",
            )}
          />
          <div
            aria-hidden
            data-testid="assistant-resize-corner"
            onPointerDown={(event) => widget.onResizePointerDown("xy", event)}
            onPointerMove={widget.onResizePointerMove}
            onPointerUp={widget.onResizePointerUp}
            onPointerCancel={widget.onResizePointerCancel}
            className={cn(
              "hover:bg-primary/60 absolute z-30 hidden size-3.5 touch-none rounded-sm transition-colors md:block",
              widget.verticalResizeEdge === "top" ? "top-0" : "bottom-0",
              widget.horizontalResizeEdge === "left" ? "left-0" : "right-0",
              widget.verticalResizeEdge === "top" && widget.horizontalResizeEdge === "left"
                ? "cursor-nwse-resize"
                : widget.verticalResizeEdge === "bottom" && widget.horizontalResizeEdge === "right"
                  ? "cursor-nwse-resize"
                  : "cursor-nesw-resize",
            )}
          />
          <AssistantChat
            variant="popup"
            canChat={widget.canChat}
            enabled={widget.isOpen}
            isCustomSize={widget.isCustomSize}
            onResetSize={widget.resetPopupSize}
            onClose={() => widget.setIsOpen(false)}
          />
        </section>
      ) : null}

      <AppTooltip content={`${displayName} · ${t("dragHint")}`} side="left">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={widget.isOpen ? t("closePopup") : t("openPopup")}
          aria-expanded={widget.isOpen}
          data-testid="assistant-floating-trigger"
          data-launcher-size={widget.launcherSize}
          data-dragging={widget.isDragging ? "true" : undefined}
          style={widget.buttonStyle}
          onPointerDown={widget.onPointerDown}
          onPointerMove={widget.onPointerMove}
          onPointerUp={widget.onPointerUp}
          onPointerCancel={widget.onPointerCancel}
          className={cn(
            "border-border/80 bg-card hover:border-primary/60 fixed z-50 rounded-full p-0 shadow-lg select-none hover:shadow-xl",
            widget.isDragging
              ? "scale-105 cursor-grabbing shadow-2xl transition-shadow"
              : "cursor-grab transition-[left,top,box-shadow] duration-200 ease-out motion-reduce:transition-none",
            widget.isOpen && "ring-primary/40 ring-2",
          )}
        >
          <AssistantAvatar
            avatarUrl={widget.assistantAvatarUrl}
            name={displayName}
            size={widget.launcherSize === "lg" ? "lg" : "default"}
            iconClassName={
              widget.launcherSize === "lg"
                ? "size-7"
                : widget.launcherSize === "md"
                  ? "size-6"
                  : "size-5"
            }
            className="size-full border-0 after:border-0"
          />
          <span
            aria-hidden
            className={cn(
              "bg-success border-background absolute right-0.5 bottom-0.5 rounded-full border-2",
              widget.launcherSize === "sm" && "size-2",
              widget.launcherSize === "md" && "size-2.5",
              widget.launcherSize === "lg" && "size-3",
            )}
          />
        </Button>
      </AppTooltip>
    </>
  );
}
