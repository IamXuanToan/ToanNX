"use client";

import type { Editor } from "@tiptap/react";
import { cn } from "cn";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Code,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";
import { Separator } from "@/shares/components/ui/separator";

import { type TextAlignValue, useTiptapToolbar } from "./hooks/use-tiptap-toolbar";
import type { TiptapEditorProps } from "./tiptap-editor.types";
import { TiptapToggle } from "./tiptap-toggle";
import { UrlPopover } from "./url-popover";

/**
 * Thanh công cụ chuẩn của `TiptapEditor`: bám dính (sticky) khi cuộn dưới đầu trang form, phân nhóm gọn
 * theo hoàn tác, kiểu đoạn, định dạng chữ, căn lề (cả đoạn văn lẫn ảnh), danh sách, liên kết,
 * chèn ảnh Thư viện/URL, video YouTube và menu Chèn mở rộng của module.
 *
 * @param props - Editor, khóa, mục chèn của module, bộ chọn ảnh.
 * @returns Toolbar.
 */
export function TiptapToolbar({
  editor,
  disabled,
  label,
  insertItems,
  onSelectImage,
}: {
  editor: Editor | null;
  disabled?: boolean;
  label: string;
  insertItems?: TiptapEditorProps["insertItems"];
  onSelectImage?: TiptapEditorProps["onSelectImage"];
}) {
  const t = useTranslations("common.editor");
  const toolbar = useTiptapToolbar(editor, onSelectImage);
  const off = !editor || disabled;
  const { active } = toolbar;
  const chain = () => editor?.chain().focus();

  const libraryItem = insertItems?.find((item) => item.key === "library-image");
  const extraInsertItems = insertItems?.filter((item) => item.key !== "library-image");

  const blockOptions = [
    { value: "paragraph", label: t("paragraph"), icon: Pilcrow, textClass: "text-sm" },
    { value: "h1", label: t("heading1"), icon: Heading1, textClass: "text-base font-bold" },
    { value: "h2", label: t("heading2"), icon: Heading2, textClass: "text-sm font-semibold" },
    { value: "h3", label: t("heading3"), icon: Heading3, textClass: "text-sm font-medium" },
    { value: "blockquote", label: t("quote"), icon: Quote, textClass: "text-sm italic" },
    { value: "codeBlock", label: t("codeBlock"), icon: Code2, textClass: "font-mono text-xs" },
  ] as const;

  const currentBlock =
    blockOptions.find((option) => option.value === (active?.block ?? "paragraph")) ??
    blockOptions[0];
  const BlockIcon = currentBlock.icon;

  const alignOptions: { value: TextAlignValue; label: string; icon: typeof AlignLeft }[] = [
    { value: "left", label: t("alignLeft"), icon: AlignLeft },
    { value: "center", label: t("alignCenter"), icon: AlignCenter },
    { value: "right", label: t("alignRight"), icon: AlignRight },
    { value: "justify", label: t("alignJustify"), icon: AlignJustify },
  ];
  const currentAlign =
    alignOptions.find((option) => option.value === (active?.align ?? "left")) ?? alignOptions[0];
  const AlignIcon = currentAlign.icon;

  return (
    <div
      role="toolbar"
      aria-label={label}
      className="bg-card/95 border-border/80 scrollbar-clean sticky top-[var(--tiptap-sticky-top,0px)] z-20 flex flex-nowrap items-center gap-0.5 overflow-x-auto rounded-t-xl border-b px-2 py-1.5 backdrop-blur-md sm:flex-wrap sm:overflow-visible"
    >
      {/* Nhóm 1: Hoàn tác / Làm lại */}
      <TiptapToggle
        label={t("undo")}
        disabled={off || !active?.canUndo}
        onClick={() => chain()?.undo().run()}
      >
        <Undo2 />
      </TiptapToggle>
      <TiptapToggle
        label={t("redo")}
        disabled={off || !active?.canRedo}
        onClick={() => chain()?.redo().run()}
      >
        <Redo2 />
      </TiptapToggle>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Nhóm 2: Chọn kiểu đoạn nhỏ gọn */}
      <DropdownMenu>
        <AppTooltip content={t("blockType")}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={off}
              aria-label={t("blockType")}
              className="bg-background/80 border-border/70 h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none"
            >
              <BlockIcon className="size-3.5 shrink-0 opacity-80" />
              <span className="max-w-24 truncate">{currentBlock.label}</span>
              <ChevronDown className="size-3 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </AppTooltip>
        <DropdownMenuContent align="start" className="w-48 rounded-xl p-1">
          {blockOptions.map((option) => {
            const Icon = option.icon;
            const selected = currentBlock.value === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => toolbar.setBlock(option.value)}
                className="flex items-center justify-between gap-2 rounded-lg"
              >
                <span className={cn("flex items-center gap-2", option.textClass)}>
                  <Icon className="size-3.5 shrink-0 opacity-75" />
                  {option.label}
                </span>
                {selected ? <Check className="text-primary size-3.5" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Nhóm 3: Định dạng chữ nội tuyến */}
      <TiptapToggle
        label={t("bold")}
        active={active?.bold}
        disabled={off}
        onClick={() => chain()?.toggleBold().run()}
      >
        <Bold />
      </TiptapToggle>
      <TiptapToggle
        label={t("italic")}
        active={active?.italic}
        disabled={off}
        onClick={() => chain()?.toggleItalic().run()}
      >
        <Italic />
      </TiptapToggle>
      <TiptapToggle
        label={t("underline")}
        active={active?.underline}
        disabled={off}
        onClick={() => chain()?.toggleUnderline().run()}
      >
        <Underline />
      </TiptapToggle>
      <TiptapToggle
        label={t("strike")}
        active={active?.strike}
        disabled={off}
        onClick={() => chain()?.toggleStrike().run()}
      >
        <Strikethrough />
      </TiptapToggle>
      <TiptapToggle
        label={t("code")}
        active={active?.code}
        disabled={off}
        onClick={() => chain()?.toggleCode().run()}
      >
        <Code />
      </TiptapToggle>
      <TiptapToggle
        label={t("highlight")}
        active={active?.highlight}
        disabled={off}
        onClick={() => chain()?.toggleHighlight({ color: "#fef08a" }).run()}
      >
        <Highlighter />
      </TiptapToggle>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Nhóm 4: Căn lề & Danh sách */}
      <DropdownMenu>
        <AppTooltip content={t("align")}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={off}
              aria-label={t("align")}
              className="h-8 gap-0.5 rounded-lg px-1.5"
            >
              <AlignIcon className="size-4" />
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </AppTooltip>
        <DropdownMenuContent align="start" className="w-40 rounded-xl p-1">
          {alignOptions.map((option) => {
            const Icon = option.icon;
            const selected = currentAlign.value === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => toolbar.setAlign(option.value)}
                className="flex items-center justify-between rounded-lg"
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Icon className="size-3.5" />
                  {option.label}
                </span>
                {selected ? <Check className="text-primary size-3.5" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <TiptapToggle
        label={t("bulletList")}
        active={active?.bulletList}
        disabled={off}
        onClick={() => chain()?.toggleBulletList().run()}
      >
        <List />
      </TiptapToggle>
      <TiptapToggle
        label={t("orderedList")}
        active={active?.orderedList}
        disabled={off}
        onClick={() => chain()?.toggleOrderedList().run()}
      >
        <ListOrdered />
      </TiptapToggle>
      <TiptapToggle
        label={t("taskList")}
        active={active?.taskList}
        disabled={off}
        onClick={() => chain()?.toggleTaskList().run()}
      >
        <ListChecks />
      </TiptapToggle>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* Nhóm 5: Liên kết, Ảnh (Thư viện + URL), Video & Menu Chèn mở rộng */}
      <UrlPopover
        label={t("link")}
        icon={<Link2 />}
        disabled={off}
        initial={editor?.getAttributes("link").href ?? ""}
        error={toolbar.error}
        onOpen={toolbar.clearError}
        onApply={(value) => toolbar.setLink(value, t("invalidUrl"))}
      />
      {onSelectImage || libraryItem ? (
        <TiptapToggle
          label={libraryItem?.label ?? t("image")}
          disabled={off || toolbar.pending}
          onClick={() => {
            if (onSelectImage) void toolbar.selectImage(t("imageFailed"));
            else if (editor && libraryItem) libraryItem.run(editor);
          }}
        >
          <ImagePlus />
        </TiptapToggle>
      ) : null}
      <UrlPopover
        label={t("imageUrl")}
        icon={<ImageIcon />}
        disabled={off}
        error={toolbar.error}
        onOpen={toolbar.clearError}
        onApply={(value) => toolbar.insertImageUrl(value, t("invalidImageUrl"))}
      />
      <UrlPopover
        label={t("youtube")}
        icon={<Video />}
        disabled={off}
        error={toolbar.error}
        onOpen={toolbar.clearError}
        onApply={(value) => toolbar.insertYoutube(value, t("invalidYoutube"))}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={off}
            className="bg-background/80 border-border/70 ml-0.5 h-8 gap-1 rounded-lg px-2 text-xs font-medium shadow-none"
          >
            <Plus className="size-3.5" />
            <span>{t("insert")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1">
          <DropdownMenuItem
            onSelect={() => chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="rounded-lg"
          >
            <Table />
            {t("table")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => chain()?.setHorizontalRule().run()}
            className="rounded-lg"
          >
            <Minus />
            {t("divider")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => chain()?.toggleBlockquote().run()}
            className="rounded-lg"
          >
            <Quote />
            {t("quote")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => chain()?.toggleCodeBlock().run()}
            className="rounded-lg"
          >
            <Code2 />
            {t("codeBlock")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => chain()?.unsetAllMarks().clearNodes().run()}
            className="rounded-lg"
          >
            <Eraser />
            {t("clearFormatting")}
          </DropdownMenuItem>
          {extraInsertItems?.length ? <DropdownMenuSeparator /> : null}
          {extraInsertItems?.map((item) => (
            <DropdownMenuItem
              key={item.key}
              onSelect={() => editor && item.run(editor)}
              className="rounded-lg"
            >
              <item.icon />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
