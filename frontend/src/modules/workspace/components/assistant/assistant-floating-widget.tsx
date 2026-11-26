"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { cn } from "cn";

import { ASSISTANT_POPUP_SIZE_OPTIONS } from "../../constants/defaults";
import { AssistantAvatar } from "./assistant-avatar";
import { AssistantChat } from "./assistant-chat";
import { useAssistantFloatingWidget } from "./hooks/use-assistant-floating-widget";

/**
 * Nút tròn Chatbot AI kéo-thả toàn Portal:
 * - Bấm để bật/tắt popup chat 1 luồng tự tính hướng bung ra phía trong khung nhìn (giống Next.js DevTools).
 * - Không chứa tùy chọn sửa Avatar/Policy phía người dùng (Admin quản trị tập trung tại `/quan-tri/he-thong/tro-ly-ai`).
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
          className="border-border/80 bg-card fixed z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
        >
          <header className="border-border/60 bg-muted/25 flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <AssistantAvatar
                avatarUrl={widget.assistantAvatarUrl}
                name={displayName}
                size="default"
                className="size-9 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-bold">{displayName}</p>
                <p className="text-muted-foreground truncate text-[11px]">{t("readySubtitle")}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <div
                role="group"
                aria-label={t("sizeLabel")}
                className="bg-muted/70 flex items-center rounded-lg border p-0.5"
              >
                {ASSISTANT_POPUP_SIZE_OPTIONS.map((size) => {
                  const selected = widget.popupSize === size;
                  return (
                    <Button
                      key={size}
                      type="button"
                      size="xs"
                      variant={selected ? "secondary" : "ghost"}
                      aria-pressed={selected}
                      data-testid={`assistant-size-${size}`}
                      onClick={() => widget.setPopupSize(size)}
                      className={cn(
                        "h-6 rounded-md px-2 text-[11px] font-medium",
                        selected ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground",
                      )}
                    >
                      {t(`sizes.${size}`)}
                    </Button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("closePopup")}
                title={t("closePopup")}
                onClick={() => widget.setIsOpen(false)}
                data-testid="assistant-popup-close"
                className="size-8 shrink-0 rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>
          </header>

          <AssistantChat variant="popup" canChat={widget.canChat} enabled={widget.isOpen} />
        </section>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={widget.isOpen ? t("closePopup") : t("openPopup")}
        aria-expanded={widget.isOpen}
        title={`${displayName} · ${t("dragHint")}`}
        data-testid="assistant-floating-trigger"
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
          size="lg"
          className="size-full border-0"
        />
        <span
          aria-hidden
          className="bg-success border-background absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2"
        />
      </Button>
    </>
  );
}
