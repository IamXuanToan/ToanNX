import type { JSONContent } from "@tiptap/core";

import type { AppLocale } from "@/i18n/routing";

/** Bộ icon emoji nhanh cho đầu trang tài liệu demo. */
export const NOTION_EMOJI_OPTIONS = ["📝", "🚀", "✨", "⚡", "🎨", "📚", "🌿", "💡"] as const;

/** Ảnh bìa mẫu trên Canvas demo. */
export const NOTION_COVER_PRESETS = [
  {
    id: "workspace-minimal",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "botanical-green",
    imageUrl:
      "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "gradient-soft",
    gradientClass: "from-emerald-500/20 via-teal-500/15 to-sky-500/20",
  },
] as const;

/** Tạo tài liệu mẫu phong phú cho Full Editor (vừa Simple Sticky Toolbar vừa Notion-like). */
export function createNotionDemoSampleDoc(locale: AppLocale): JSONContent {
  if (locale === "en") {
    return {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Welcome to ToanNX Unified Full Editor" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Drag any line using the left " },
            { type: "text", marks: [{ type: "bold" }], text: "⠿ grip handle" },
            { type: "text", text: ", type " },
            { type: "text", marks: [{ type: "code" }], text: "/" },
            {
              type: "text",
              text: " to insert blocks, select text for the floating menu, or use the ",
            },
            {
              type: "text",
              marks: [{ type: "highlight", attrs: { color: "#fef08a" } }],
              text: "sticky toolbar above",
            },
            { type: "text", text: "." },
          ],
        },
        {
          type: "callout",
          attrs: { tone: "info" },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Try dragging blocks: " },
                {
                  type: "text",
                  text: "Hover over any line and grab ⠿ on the left to reorder paragraphs, callouts, checklists, or images smoothly.",
                },
              ],
            },
          ],
        },
        {
          type: "image",
          attrs: {
            src: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1200&q=85",
            alt: "Minimal creative workspace (click image to resize & align)",
            width: "75%",
            align: "center",
          },
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Interactive Checklist" }],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Drag ⠿ handle to reorder lines up or down" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Click images to resize (25%–100%) and align" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Try standalone Basic & Comment editors above" }],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Trình soạn thảo hợp nhất Simple + Notion-like" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Giữ và kéo biểu tượng " },
          { type: "text", marks: [{ type: "bold" }], text: "⠿ bên trái để kéo thả sắp xếp dòng" },
          { type: "text", text: ", gõ " },
          { type: "text", marks: [{ type: "code" }], text: "/" },
          { type: "text", text: " để chèn khối, bôi đen chữ để định dạng nhanh hoặc bấm ngay " },
          {
            type: "text",
            marks: [{ type: "highlight", attrs: { color: "#fef08a" } }],
            text: "thanh công cụ cố định phía trên",
          },
          { type: "text", text: "." },
        ],
      },
      {
        type: "callout",
        attrs: { tone: "info" },
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", marks: [{ type: "bold" }], text: "Thử kéo thả dòng & ảnh: " },
              {
                type: "text",
                text: "Rê chuột sang mép trái dòng bất kỳ rồi giữ nút ⠿ kéo lên/xuống để đổi thứ tự khối; bấm vào ảnh để kéo nhỏ hoặc căn giữa.",
              },
            ],
          },
        ],
      },
      {
        type: "image",
        attrs: {
          src: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1200&q=85",
          alt: "Không gian làm việc tối giản (bấm ảnh để kéo chỉnh & căn lề)",
          width: "75%",
          align: "center",
        },
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Danh sách trải nghiệm nhanh" }],
      },
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Giữ và kéo nút ⠿ bên trái để đổi vị trí các khối" },
                ],
              },
            ],
          },
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Kéo thả thay đổi kích thước & căn lề ảnh" }],
              },
            ],
          },
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Chuyển tab phía trên để thử bản Basic (Mô tả) & Comment" },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Dữ liệu mẫu ban đầu cho bản Basic (Mô tả — chỉ đậm & nghiêng). */
export function createBasicDemoSampleDoc(locale: AppLocale): JSONContent {
  if (locale === "en") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Short product description supporting " },
            { type: "text", marks: [{ type: "bold" }], text: "bold" },
            { type: "text", text: " and " },
            { type: "text", marks: [{ type: "italic" }], text: "italic" },
            { type: "text", text: " formatting without distracting controls." },
          ],
        },
      ],
    };
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Đoạn mô tả ngắn gọn chỉ hỗ trợ định dạng " },
          { type: "text", marks: [{ type: "bold" }], text: "in đậm" },
          { type: "text", text: " và " },
          { type: "text", marks: [{ type: "italic" }], text: "in nghiêng" },
          { type: "text", text: ", phù hợp cho phần giới thiệu hoặc mô tả bản ghi." },
        ],
      },
    ],
  };
}
