import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MergeFieldBadgeView } from "./merge-field-badge-view";

/**
 * Tiptap inline Node đại diện cho trường trộn biến `{{fieldKey}}` trong mẫu email.
 * Hiển thị dưới dạng badge đẹp khi soạn thảo, xuất ra `<span data-merge-field="...">` và text `{{fieldKey}}`.
 */
export const MergeFieldNode = Node.create({
  name: "mergeField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      fieldKey: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-merge-field") || "",
        renderHTML: (attributes) => ({
          "data-merge-field": String(attributes.fieldKey || ""),
        }),
      },
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-merge-label") || "",
        renderHTML: (attributes) =>
          attributes.label ? { "data-merge-label": String(attributes.label) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-merge-field]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const fieldKey = String(node.attrs.fieldKey || "");
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class:
          "inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary mx-0.5",
      }),
      `{{${fieldKey}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${String(node.attrs.fieldKey || "")}}}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(MergeFieldBadgeView);
  },
});
