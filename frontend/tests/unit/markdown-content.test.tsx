// @vitest-environment jsdom
import type { AnchorHTMLAttributes } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import { MarkdownContent } from "@/shares/components/common/markdown-content";
import { parseMarkdown } from "@/shares/lib/markdown";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

function renderMd(content: string) {
  return render(
    <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={commonVi}>
      <MarkdownContent content={content} />
    </NextIntlClientProvider>,
  );
}

describe("parseMarkdown & MarkdownContent (render Markdown an toàn cho Chatbot AI)", () => {
  it("chuyển đổi đúng văn bản mẫu của AI (bold section + danh sách gạch đầu dòng) không còn ký hiệu ** thô", () => {
    const sample = [
      "Tôi có thể giúp bạn quản lý công việc và tài chính cá nhân với các tính năng sau:",
      "",
      "**Quản lý công việc:**",
      "- Tạo nhắc việc cá nhân theo ngày giờ",
      "- Xem các việc chưa hoàn thành (hôm nay, quá hạn)",
      "",
      "**Quản lý tài chính:**",
      "- Tổng hợp chi tiêu hàng tháng",
    ].join("\n");

    const { container } = renderMd(sample);

    const strongs = [...container.querySelectorAll("strong")].map((el) => el.textContent);
    expect(strongs).toEqual(["Quản lý công việc:", "Quản lý tài chính:"]);
    expect(container.querySelectorAll("ul")).toHaveLength(2);
    expect([...container.querySelectorAll("li")].map((el) => el.textContent?.trim())).toEqual([
      "Tạo nhắc việc cá nhân theo ngày giờ",
      "Xem các việc chưa hoàn thành (hôm nay, quá hạn)",
      "Tổng hợp chi tiêu hàng tháng",
    ]);
    expect(container.textContent).not.toContain("**");
  });

  it("hỗ trợ heading, nghiêng, gạch ngang, code block, bảng GFM, task list, blockquote và đạn • của slash command", () => {
    const md = [
      "## Tổng quan",
      "",
      "Xem *chi tiết* ~~cũ~~ và `/xoa_lich_su` hoặc **học _thêm_ mới**.",
      "",
      "> Lưu ý: số liệu lấy trực tiếp từ hệ thống.",
      "",
      "```json",
      '{"total": 120000}',
      "```",
      "",
      "| Hạng mục | Số tiền |",
      "| :--- | ---: |",
      "| Hosting | 120.000 đ |",
      "",
      "- Mục gạch đầu dòng thường",
      "- [x] Đã kiểm tra",
      "- [ ] Cần gia hạn",
      "",
      "Các lệnh nhanh (0 token AI):",
      "• /hom_nay — Xem việc cần làm",
      "• /xoa_lich_su — Xóa lịch sử",
    ].join("\n");

    const { container } = renderMd(md);

    expect(screen.getByRole("heading", { level: 2, name: "Tổng quan" })).toBeTruthy();
    // Underscore trong lệnh /xoa_lich_su không bị biến thành <em>
    const emTexts = [...container.querySelectorAll("em")].map((el) => el.textContent);
    expect(emTexts).toEqual(["chi tiết", "thêm"]);
    expect(container.querySelector("del")?.textContent).toBe("cũ");
    expect(container.querySelector("blockquote")?.textContent).toContain("Lưu ý:");
    expect(container.querySelector("pre code")?.textContent).toBe('{"total": 120000}');
    expect(container.querySelector("table th:nth-child(2)")?.className).toContain("text-right");
    expect(container.querySelector("table td:nth-child(2)")?.textContent).toBe("120.000 đ");
    // Khi trộn mục thường + task list, ul vẫn giữ list-disc cho mục thường và chỉ li task dùng list-none
    const lists = [...container.querySelectorAll("ul")];
    expect(lists[0]?.className).toContain("list-disc");
    expect(lists[0]?.querySelectorAll("li")[1]?.className).toContain("list-none");
    expect(container.textContent).toContain("Mục gạch đầu dòng thường");
    expect(container.textContent).toContain("Đã kiểm tra");
    expect(container.textContent).toContain("Cần gia hạn");
    expect(container.textContent).toContain("/xoa_lich_su");
  });

  it("chặn link XSS nguy hiểm (javascript:, data:) và HTML thô, chỉ giữ link http/https/nội bộ hợp lệ", () => {
    const blocks = parseMarkdown(
      [
        "Thử [XSS](javascript:alert(1)), ![pixel](https://tracker.example/x.png) và <script>alert(1)</script>.",
        "Xem [Tài liệu](https://toannx.com/docs) và https://example.org/help.",
      ].join("\n"),
    );

    expect(blocks).toHaveLength(1);
    const { container } = renderMd(
      [
        "Thử [XSS](javascript:alert(1)), [Data](data:text/html,<script>alert(1)</script>) và <script>alert(1)</script>.",
        "Xem [Tài liệu](https://toannx.com/docs) và https://example.org/help.",
      ].join("\n"),
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://toannx.com/docs",
      "https://example.org/help",
    ]);
    expect(links[0]?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(links[0]?.getAttribute("target")).toBe("_blank");
    // Link javascript:/data: bị hạ cấp thành text thường, không tạo <a>
    expect(screen.queryByRole("link", { name: "XSS" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Data" })).toBeNull();
    expect(container.textContent).toContain("XSS");
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
});
