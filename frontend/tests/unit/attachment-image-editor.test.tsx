// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AttachmentImageEditor } from "@/modules/system/components/attachment/attachment-image-editor";
import type { Attachment } from "@/modules/system/types/attachment.types";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock("react-easy-crop", () => ({
  default: () => <div data-testid="mock-cropper">Mock Cropper</div>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      imageEditorTitle: "Chỉnh sửa hình ảnh",
      crop: "Cắt ảnh",
      watermark: "Đóng dấu",
      cropShapeSquare: "Vuông (1:1)",
      cropShapeRound: "Tròn",
      cropShapeFree: "Tự do",
      watermarkEnable: "Bật đóng dấu watermark",
      watermarkText: "Nội dung chữ đóng dấu",
      saveAsNew: "Lưu ảnh mới",
      cancel: "Hủy",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/modules/system/hooks/use-upload-attachment", () => ({
  useUploadAttachment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("AttachmentImageEditor", () => {
  afterEach(() => {
    cleanup();
  });

  const mockFile: Attachment = {
    id: "att-123",
    originalName: "avatar.jpg",
    contentType: "image/jpeg",
    size: 102400,
    url: "https://example.com/avatar.jpg",
    visibility: "public",
    folderId: null,
    folderName: "",
    uploaderName: "Admin",
    createdById: null,
    altText: "Avatar",
    createdAt: new Date().toISOString(),
  };

  it("hiển thị đúng các tùy chọn cắt ảnh và chuyển sang tab watermark thành công", () => {
    const handleSaved = vi.fn();
    const handleCancel = vi.fn();

    render(<AttachmentImageEditor file={mockFile} onSaved={handleSaved} onCancel={handleCancel} />);

    // Kiểm tra render cropper
    expect(screen.getByTestId("mock-cropper")).toBeDefined();

    // Kiểm tra các nút cắt ảnh
    expect(screen.getByText("Vuông (1:1)")).toBeDefined();
    expect(screen.getByText("Tròn")).toBeDefined();
    expect(screen.getByText("Tự do")).toBeDefined();

    // Chuyển sang tab Đóng dấu (Watermark)
    const watermarkTab = screen.getByRole("tab", { name: /đóng dấu/i });
    fireEvent.keyDown(watermarkTab, { key: "Enter" });
    fireEvent.click(watermarkTab);

    // Kiểm tra switch bật đóng dấu
    expect(screen.getByText("Bật đóng dấu watermark")).toBeDefined();

    // Bấm nút Hủy
    const cancelBtn = screen.getByRole("button", { name: /hủy/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("cho phép nhập text watermark và hiển thị preview", () => {
    const handleSaved = vi.fn();
    const handleCancel = vi.fn();

    render(<AttachmentImageEditor file={mockFile} onSaved={handleSaved} onCancel={handleCancel} />);

    // Chuyển sang tab watermark
    const watermarkTab = screen.getByRole("tab", { name: /đóng dấu/i });
    fireEvent.keyDown(watermarkTab, { key: "Enter" });
    fireEvent.click(watermarkTab);

    // Bật switch watermark
    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    // Nhập text watermark
    // Tab có cả ô mã màu: lấy đúng ô nội dung chữ theo nhãn.
    const input = screen.getByLabelText("Nội dung chữ đóng dấu");
    fireEvent.change(input, { target: { value: "toannx.com" } });

    // Kiểm tra text watermark hiển thị
    expect(screen.getByText("toannx.com")).toBeDefined();
  });
});
