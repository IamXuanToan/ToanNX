"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { cn } from "cn";
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Palette,
  Pilcrow,
  Quote,
  Sparkles,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";
import { FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { Separator } from "@/shares/components/ui/separator";

import { isAllowedLink } from "./hooks/use-tiptap-toolbar";
import { TIPTAP_HIGHLIGHT_COLORS, TIPTAP_TEXT_COLORS } from "./tiptap-extensions";

/**
 * Thanh định dạng nổi kiểu Notion (`BubbleMenu`) dùng chung cho `TiptapEditor`: xuất hiện khi bôi
 * đen chữ, tự ẩn khi đang chọn ảnh (ảnh có thanh resize/căn lề riêng).
 */
export function TiptapBubbleToolbar({
  editor,
  onOpenAi,
}: {
  editor: Editor;
  onOpenAi?: () => void;
}) {
  const t = useTranslations("common.editor");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      highlight: current.isActive("highlight"),
      link: current.isActive("link"),
      block: current.isActive("heading", { level: 1 })
        ? "h1"
        : current.isActive("heading", { level: 2 })
          ? "h2"
          : current.isActive("heading", { level: 3 })
            ? "h3"
            : current.isActive("bulletList")
              ? "bulletList"
              : current.isActive("orderedList")
                ? "orderedList"
                : current.isActive("taskList")
                  ? "taskList"
                  : current.isActive("blockquote")
                    ? "blockquote"
                    : "paragraph",
    }),
  });

  const blockItems = [
    { value: "paragraph", label: t("paragraph"), icon: Pilcrow },
    { value: "h1", label: t("heading1"), icon: Heading1 },
    { value: "h2", label: t("heading2"), icon: Heading2 },
    { value: "h3", label: t("heading3"), icon: Heading3 },
    { value: "bulletList", label: t("bulletList"), icon: List },
    { value: "orderedList", label: t("orderedList"), icon: ListOrdered },
    { value: "taskList", label: t("taskList"), icon: ListChecks },
    { value: "blockquote", label: t("quote"), icon: Quote },
  ] as const;

  const currentBlock =
    blockItems.find((item) => item.value === (active?.block ?? "paragraph")) ?? blockItems[0];

  const applyTurnInto = (kind: (typeof blockItems)[number]["value"]) => {
    const chain = editor.chain().focus();
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
      case "taskList":
        chain.toggleTaskList().run();
        break;
      case "blockquote":
        chain.toggleBlockquote().run();
        break;
    }
  };

  const applyLink = () => {
    const trimmed = linkValue.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      setLinkError("");
      return;
    }
    if (!isAllowedLink(trimmed)) {
      setLinkError(t("invalidUrl"));
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    setLinkOpen(false);
    setLinkError("");
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: current, state }) => {
        if (!current.isEditable) return false;
        if (current.isActive("image") || current.isActive("codeBlock")) return false;
        const { from, to } = state.selection;
        return from !== to && state.doc.textBetween(from, to, "").trim().length > 0;
      }}
    >
      <div
        role="toolbar"
        aria-label={t("turnInto")}
        onMouseDown={(event) => event.preventDefault()}
        className="bg-popover/95 border-border/80 flex max-w-[92vw] flex-wrap items-center gap-0.5 rounded-xl border p-1 shadow-xl backdrop-blur-md"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="h-7 gap-1 rounded-lg px-2 text-xs font-medium"
            >
              <currentBlock.icon className="size-3.5" />
              <span>{currentBlock.label}</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1">
            {blockItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.value}
                  onSelect={() => applyTurnInto(item.value)}
                  className="flex items-center justify-between rounded-lg text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="size-3.5 opacity-75" />
                    {item.label}
                  </span>
                  {currentBlock.value === item.value ? (
                    <Check className="text-primary size-3.5" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-0.5 h-4" />

        <Button
          type="button"
          size="icon-xs"
          variant={active?.bold ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label={t("bold")}
          className={cn("rounded-lg", active?.bold && "text-primary")}
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={active?.italic ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label={t("italic")}
          className={cn("rounded-lg", active?.italic && "text-primary")}
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={active?.underline ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label={t("underline")}
          className={cn("rounded-lg", active?.underline && "text-primary")}
        >
          <Underline className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={active?.strike ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label={t("strike")}
          className={cn("rounded-lg", active?.strike && "text-primary")}
        >
          <Strikethrough className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant={active?.code ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label={t("code")}
          className={cn("rounded-lg", active?.code && "text-primary")}
        >
          <Code className="size-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-4" />

        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open);
            if (open) {
              setLinkValue((editor.getAttributes("link").href as string) ?? "");
              setLinkError("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant={active?.link ? "secondary" : "ghost"}
              aria-label={t("link")}
              className={cn("rounded-lg", active?.link && "text-primary")}
            >
              <Link2 className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2 rounded-xl" align="center">
            <div className="flex gap-2">
              <Input
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    applyLink();
                  }
                }}
                placeholder="https://..."
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" onClick={applyLink} className="h-8 shrink-0">
                {t("apply")}
              </Button>
            </div>
            <FieldError>{linkError}</FieldError>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant={active?.highlight ? "secondary" : "ghost"}
              aria-label={t("textColor")}
              className="rounded-lg"
            >
              <Palette className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-3 rounded-xl p-3" align="end">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  {t("textColor")}
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}
                  className="h-6 px-1.5 text-[11px]"
                >
                  {t("resetColor")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIPTAP_TEXT_COLORS.map((swatch) => (
                  <Button
                    key={swatch.key}
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    aria-label={swatch.key}
                    onClick={() => editor.chain().focus().setColor(swatch.hex).run()}
                    className="size-6 rounded-full border p-0 font-bold"
                    style={{ color: swatch.hex }}
                  >
                    A
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold">
                <Highlighter className="size-3" />
                {t("highlight")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TIPTAP_HIGHLIGHT_COLORS.map((swatch) => (
                  <Button
                    key={swatch.key}
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    aria-label={swatch.key}
                    onClick={() =>
                      editor.chain().focus().toggleHighlight({ color: swatch.hex }).run()
                    }
                    className="size-6 rounded-full border p-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {onOpenAi ? (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-5" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onOpenAi}
              className="text-primary hover:text-primary h-7 gap-1 rounded-md px-2 text-xs font-medium"
            >
              <Sparkles className="size-3.5" />
              <span>AI</span>
            </Button>
          </>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
