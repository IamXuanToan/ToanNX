// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AttachmentDetailDialog } from "@/modules/system/components/attachment-detail-dialog";
import type { Attachment } from "@/modules/system/types/attachment.types";

const mockUpdateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/modules/system/hooks/use-update-attachment", () => ({
  useUpdateAttachment: () => ({
    mutateAsync: mockUpdateAsync,
    isPending: false,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      details: "Thông tin tệp",
      name: "Tên tệp",
      edit: "Sửa",
      copyName: "Chép tên",
      copiedName: "Đã chép tên",
      copyUrl: "Sao chép liên kết",
      copied: "Đã chép",
      openFile: "Mở tệp",
      deleteFile: "Xóa tệp",
      close: "Đóng",
      useImage: "Dùng ảnh này",
      folder: "Thư mục",
      unfiled: "Chưa phân loại",
      uploader: "Người tải lên",
      altText: "Văn bản thay thế (alt)",
      noAltText: "Chưa có alt text",
      uploadedAt: "Ngày tải lên",
      editFileTitle: "Chỉnh sửa thông tin tệp",
      cancel: "Hủy",
      fileName: "Tên tệp",
      altTextPlaceholder: "Mô tả ngắn gọn nội dung ảnh...",
      altTextHint: "Giúp tối ưu SEO và hỗ trợ người khiếm thị đọc nội dung tốt hơn.",
      saveChanges: "Lưu thay đổi",
      saving: "Đang lưu...",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: () => "20:49 20 thg 11, 2026",
  }),
}));

const mockFile: Attachment = {
  id: "att-123",
  originalName: "attachments_2026_11_photo.jpg",
  url: "https://r2.example.com/photo.jpg",
  contentType: "image/jpeg",
  size: 387921,
  folderId: null,
  folderName: "",
  createdById: "user-123",
  uploaderName: "Nguyễn Xuân Toàn (toannx)",
  altText: "Chân dung cô gái tươi cười",
  createdAt: "2026-11-20T13:49:00Z",
};

describe("AttachmentDetailDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị đầy đủ thông tin tệp và không bị cắt chữ trong footer", () => {
    render(
      <AttachmentDetailDialog
        file={mockFile}
        open={true}
        onClose={vi.fn()}
        canEdit={true}
        canDelete={true}
        onDelete={vi.fn()}
      />,
    );

    // Tiêu đề & Tên tệp
    expect(screen.getByText("Thông tin tệp")).toBeDefined();
    expect(screen.getAllByText("attachments_2026_11_photo.jpg").length).toBeGreaterThan(0);

    // Tag định dạng và dung lượng
    expect(screen.getByText("JPEG")).toBeDefined();
    expect(screen.getByText("379 KB")).toBeDefined();

    // Thư mục và người upload
    expect(screen.getByText("Chưa phân loại")).toBeDefined();
    expect(screen.getByText("Nguyễn Xuân Toàn (toannx)")).toBeDefined();

    // Alt text
    expect(screen.getByText("Chân dung cô gái tươi cười")).toBeDefined();

    // Nút trong Footer không bị cắt ngắn (có đầy đủ chữ)
    expect(screen.getByText("Sao chép liên kết")).toBeDefined();
    expect(screen.getByText("Mở tệp")).toBeDefined();
    expect(screen.getByText("Xóa tệp")).toBeDefined();
    expect(screen.getByText("Đóng")).toBeDefined();
  });

  it("chuyển sang chế độ inline edit và hủy bỏ thành công", () => {
    render(<AttachmentDetailDialog file={mockFile} open={true} onClose={vi.fn()} canEdit={true} />);

    // Bấm nút Sửa
    const editBtn = screen.getByRole("button", { name: /sửa/i });
    fireEvent.click(editBtn);

    // Form sửa inline xuất hiện
    expect(screen.getByText("Chỉnh sửa thông tin tệp")).toBeDefined();
    expect(screen.getByDisplayValue("attachments_2026_11_photo.jpg")).toBeDefined();
    expect(screen.getByDisplayValue("Chân dung cô gái tươi cười")).toBeDefined();

    // Bấm Hủy
    const cancelBtns = screen.getAllByRole("button", { name: /hủy/i });
    fireEvent.click(cancelBtns[0]);

    // Trở về chế độ xem ban đầu
    expect(screen.queryByText("Chỉnh sửa thông tin tệp")).toBeNull();
    expect(screen.getByText("Sao chép liên kết")).toBeDefined();
  });

  it("hiển thị nút 'Dùng ảnh này' khi có onSelect", () => {
    const handleSelect = vi.fn();
    render(
      <AttachmentDetailDialog
        file={mockFile}
        open={true}
        onClose={vi.fn()}
        onSelect={handleSelect}
      />,
    );

    const useImageBtn = screen.getByRole("button", { name: /dùng ảnh này/i });
    expect(useImageBtn).toBeDefined();

    fireEvent.click(useImageBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockFile);
  });
});
