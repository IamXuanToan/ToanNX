"use client";

import type { Editor } from "@tiptap/react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Highlighter, ImageIcon, ImagePlus, Italic, Link2, List, ListChecks, ListOrdered, Minus, Plus, Quote, Redo2, Strikethrough, Table, Underline, Undo2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shares/components/ui/dropdown-menu";
import { FieldError } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { Separator } from "@/shares/components/ui/separator";

import { SelectField } from "./select-field";
import { useTiptapToolbar } from "./hooks/use-tiptap-toolbar";
import { useUrlPopover } from "./hooks/use-url-popover";
import type { TiptapEditorProps } from "./tiptap-editor.types";

type ToggleProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function Toggle({ label, active, disabled, onClick, children }: ToggleProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "secondary" : "ghost"}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** Ô nhập URL trong popover (liên kết, ảnh URL ngoài, video). */
function UrlPopover({
  label,
  icon,
  disabled,
  initial = "",
  onApply,
  error,
  onOpen,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  initial?: string;
  onApply: (value: string) => boolean;
  error: string;
  onOpen: () => void;
}) {
  const t = useTranslations("common.editor");
  const { open, value, setValue, handleOpenChange, handleSubmit } = useUrlPopover({
    initial,
    onApply,
    onOpen,
  });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={label}
          title={label}
          disabled={disabled}
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 rounded-xl">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            aria-label={label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://"
            autoFocus
          />
          <Button type="submit">{t("apply")}</Button>
        </form>
        <FieldError>{error}</FieldError>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Thanh công cụ chuẩn của `TiptapEditor`: hoàn tác, kiểu đoạn, định dạng chữ, căn lề, danh sách,
 * liên kết, ảnh (Thư viện của module hoặc URL ngoài), video YouTube, menu Chèn (bảng, đường kẻ, mục của module).
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
  const AlignIcon = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
    justify: AlignJustify,
  }[active?.align ?? "left"];
  const nextAlign = { left: "center", center: "right", right: "justify", justify: "left" } as const;

  return (
    <div
      role="toolbar"
      aria-label={label}
      className="bg-card flex flex-wrap items-center gap-1 border-b p-1"
    >
      <Toggle
        label={t("undo")}
        disabled={off || !active?.canUndo}
        onClick={() => chain()?.undo().run()}
      >
        <Undo2 />
      </Toggle>
      <Toggle
        label={t("redo")}
        disabled={off || !active?.canRedo}
        onClick={() => chain()?.redo().run()}
      >
        <Redo2 />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <SelectField
        aria-label={t("blockType")}
        className="w-36"
        disabled={off}
        value={active?.block ?? "paragraph"}
        onValueChange={toolbar.setBlock}
        options={[
          { value: "paragraph", label: t("paragraph") },
          { value: "h1", label: t("heading1") },
          { value: "h2", label: t("heading2") },
          { value: "h3", label: t("heading3") },
        ]}
      />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Toggle
        label={t("bold")}
        active={active?.bold}
        disabled={off}
        onClick={() => chain()?.toggleBold().run()}
      >
        <Bold />
      </Toggle>
      <Toggle
        label={t("italic")}
        active={active?.italic}
        disabled={off}
        onClick={() => chain()?.toggleItalic().run()}
      >
        <Italic />
      </Toggle>
      <Toggle
        label={t("underline")}
        active={active?.underline}
        disabled={off}
        onClick={() => chain()?.toggleUnderline().run()}
      >
        <Underline />
      </Toggle>
      <Toggle
        label={t("strike")}
        active={active?.strike}
        disabled={off}
        onClick={() => chain()?.toggleStrike().run()}
      >
        <Strikethrough />
      </Toggle>
      <Toggle
        label={t("code")}
        active={active?.code}
        disabled={off}
        onClick={() => chain()?.toggleCode().run()}
      >
        <Code />
      </Toggle>
      <Toggle
        label={t("highlight")}
        active={active?.highlight}
        disabled={off}
        onClick={() => chain()?.toggleHighlight({ color: "#fef08a" }).run()}
      >
        <Highlighter />
      </Toggle>
      <Toggle
        label={t("align")}
        disabled={off}
        onClick={() =>
          chain()
            ?.setTextAlign(nextAlign[active?.align ?? "left"])
            .run()
        }
      >
        <AlignIcon />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Toggle
        label={t("bulletList")}
        active={active?.bulletList}
        disabled={off}
        onClick={() => chain()?.toggleBulletList().run()}
      >
        <List />
      </Toggle>
      <Toggle
        label={t("orderedList")}
        active={active?.orderedList}
        disabled={off}
        onClick={() => chain()?.toggleOrderedList().run()}
      >
        <ListOrdered />
      </Toggle>
      <Toggle
        label={t("taskList")}
        active={active?.taskList}
        disabled={off}
        onClick={() => chain()?.toggleTaskList().run()}
      >
        <ListChecks />
      </Toggle>
      <Toggle
        label={t("quote")}
        active={active?.blockquote}
        disabled={off}
        onClick={() => chain()?.toggleBlockquote().run()}
      >
        <Quote />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <UrlPopover
        label={t("link")}
        icon={<Link2 />}
        disabled={off}
        initial={editor?.getAttributes("link").href ?? ""}
        error={toolbar.error}
        onOpen={toolbar.clearError}
        onApply={(value) => toolbar.setLink(value, t("invalidUrl"))}
      />
      {onSelectImage ? (
        <Toggle
          label={t("image")}
          disabled={off || toolbar.pending}
          onClick={() => void toolbar.selectImage(t("imageFailed"))}
        >
          <ImagePlus />
        </Toggle>
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
          <Button type="button" variant="ghost" disabled={off}>
            <Plus />
            {t("insert")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-xl">
          <DropdownMenuItem
            onSelect={() => chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <Table />
            {t("table")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain()?.setHorizontalRule().run()}>
            <Minus />
            {t("divider")}
          </DropdownMenuItem>
          {insertItems?.length ? <DropdownMenuSeparator /> : null}
          {insertItems?.map((item) => (
            <DropdownMenuItem key={item.key} onSelect={() => editor && item.run(editor)}>
              <item.icon />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
