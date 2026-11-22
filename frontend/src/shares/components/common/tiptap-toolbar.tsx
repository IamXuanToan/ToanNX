"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
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

import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";
import { Separator } from "@/shares/components/ui/separator";

import { SelectField } from "./select-field";
import { useTiptapToolbar } from "./hooks/use-tiptap-toolbar";
import type { TiptapEditorProps } from "./tiptap-editor.types";
import { TiptapToggle } from "./tiptap-toggle";
import { UrlPopover } from "./url-popover";

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
      <TiptapToggle
        label={t("align")}
        disabled={off}
        onClick={() =>
          chain()
            ?.setTextAlign(nextAlign[active?.align ?? "left"])
            .run()
        }
      >
        <AlignIcon />
      </TiptapToggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
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
      <TiptapToggle
        label={t("quote")}
        active={active?.blockquote}
        disabled={off}
        onClick={() => chain()?.toggleBlockquote().run()}
      >
        <Quote />
      </TiptapToggle>
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
        <TiptapToggle
          label={t("image")}
          disabled={off || toolbar.pending}
          onClick={() => void toolbar.selectImage(t("imageFailed"))}
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
