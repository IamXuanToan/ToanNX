import { mergeAttributes, Node } from "@tiptap/core";

/**
 * Node riêng của trang (khớp danh sách cho phép ở BE `page_content_validator`). Dùng chung cho editor và bản
 * công khai (`TiptapContent`) nên JSON hiển thị lại đúng như lúc soạn.
 */

/** Nút liên kết: link thường (`href`) hoặc link rút gọn của chủ trang (`shortLinkId`, BE dựng `href`). */
export const PageButton = Node.create({
  name: "button",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      label: { default: "" },
      href: { default: "" },
      shortLinkId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-short-link-id"),
        renderHTML: (attrs: { shortLinkId?: string | null }) =>
          attrs.shortLinkId ? { "data-short-link-id": attrs.shortLinkId } : {},
      },
      variant: { default: "primary" },
    };
  },
  parseHTML() {
    return [{ tag: 'a[data-type="button"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const outline = node.attrs.variant === "outline";
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "button",
        href: node.attrs.href || undefined,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class:
          "page-button my-2 flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium no-underline " +
          (outline
            ? "border border-[var(--page-primary,var(--primary))] bg-transparent text-[var(--page-primary,var(--primary))]"
            : "bg-[var(--page-primary,var(--primary))] text-primary-foreground"),
      }),
      node.attrs.label || node.attrs.href || "",
    ];
  },
});

/** Khối nhấn mạnh có tông màu, chứa nội dung bất kỳ. */
export const PageCallout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { tone: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        "data-tone": node.attrs.tone,
        class:
          "my-3 rounded-xl border-l-4 border-[var(--page-primary,var(--primary))] bg-muted/70 p-4",
      }),
      0,
    ];
  },
});

/** Khoảng trống dọc (sm, md, lg). */
export const PageSpacer = Node.create({
  name: "spacer",
  group: "block",
  atom: true,
  addAttributes() {
    return { size: { default: "md" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const height =
      { sm: "h-4", md: "h-8", lg: "h-16" }[node.attrs.size as "sm" | "md" | "lg"] ?? "h-8";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "spacer",
        "aria-hidden": "true",
        class: height,
      }),
    ];
  },
});

/** Mọi node riêng của trang. */
export const PAGE_EXTENSIONS = [PageButton, PageCallout, PageSpacer];
