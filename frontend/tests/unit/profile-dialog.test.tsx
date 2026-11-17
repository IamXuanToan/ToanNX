// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileDialog } from "@/modules/auth/components/profile-dialog/profile-dialog";
import type { AuthRole, AuthUser } from "@/modules/auth/types/auth.types";

const mockUpdateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/modules/auth/hooks/use-update-profile", () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockUpdateAsync,
    isPending: false,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: "Hồ sơ cá nhân",
      description: "Quản lý thông tin tài khoản, quyền truy cập và bảo mật của bạn.",
      "tabs.info": "Thông tin cá nhân",
      "tabs.security": "Bảo mật",
      avatar: "Ảnh đại diện",
      avatarRemove: "Gỡ ảnh",
      avatarHint: "Định dạng PNG, JPG hoặc WEBP.",
      roles: "Vai trò hệ thống",
      roleSuperuser: "Siêu quản trị",
      roleStaff: "Quản trị viên",
      roleNovel: "Tác giả Novel",
      roleUser: "Người dùng",
      email: "Email đăng nhập",
      emailPlaceholder: "name@example.com",
      emailInvalid: "Email chưa đúng định dạng.",
      username: "Tên người dùng",
      usernamePlaceholder: "Nhập tên người dùng",
      usernameRequired: "Vui lòng nhập tên người dùng.",
      lastName: "Họ và tên đệm",
      lastNamePlaceholder: "Nguyễn Văn",
      firstName: "Tên",
      firstNamePlaceholder: "An",
      securityTitle: "Thay đổi mật khẩu đăng nhập",
      securityDescription: "Khi đổi mật khẩu thành công...",
      newPassword: "Mật khẩu mới",
      newPasswordPlaceholder: "Tối thiểu 8 ký tự",
      confirmPassword: "Xác nhận mật khẩu mới",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu mới",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự.",
      passwordMismatch: "Mật khẩu xác nhận không khớp.",
      passwordRequired: "Vui lòng xác nhận mật khẩu mới.",
      saveInfo: "Lưu thông tin",
      savePassword: "Cập nhật mật khẩu",
      saving: "Đang lưu...",
      cancel: "Đóng",
      "activity.status": "Trạng thái",
      "activity.online": "Trực tuyến",
      "activity.offline": "Ngoại tuyến",
      "activity.lastLogin": "Lần đăng nhập cuối",
      "activity.dateJoined": "Ngày tham gia",
      "activity.never": "Chưa từng đăng nhập",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: () => "01/01/2026 12:00",
    relativeTime: () => "vừa xong",
  }),
  useNow: () => new Date(),
}));

const mockUser: AuthUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "nxtoan2k4@gmail.com",
  username: "toannx",
  firstName: "Toàn",
  lastName: "Nguyễn Xuân",
  fullName: "Nguyễn Xuân Toàn",
  avatar: { id: "a1", url: "https://example.com/avatar.png" },
  isActive: true,
  isStaff: true,
  isSuperuser: true,
  isNovel: false,
  lastLogin: "2026-01-01T12:00:00Z",
  lastSeenAt: "2026-01-01T12:00:00Z",
  dateJoined: "2026-01-01T00:00:00Z",
};

const mockRoles: AuthRole[] = [{ id: "r1", code: "role_editor", name: "Biên tập viên" }];

describe("ProfileDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị đầy đủ thông tin: họ tên, email, username, vai trò, lần login cuối và avatar", () => {
    render(
      <ProfileDialog
        user={mockUser}
        roles={mockRoles}
        open={true}
        onOpenChange={vi.fn()}
        renderAttachmentPicker={() => <div data-testid="mock-picker" />}
      />,
    );

    // Header & Tên hiển thị
    expect(screen.getByText("Hồ sơ cá nhân")).toBeTruthy();
    expect(screen.getByText("Nguyễn Xuân Toàn")).toBeTruthy();
    expect(screen.getByText("Siêu quản trị")).toBeTruthy();
    expect(screen.getByText("Biên tập viên")).toBeTruthy();

    // Inputs form tab thông tin
    expect(screen.getByDisplayValue("nxtoan2k4@gmail.com")).toBeTruthy();
    expect(screen.getByDisplayValue("toannx")).toBeTruthy();
    expect(screen.getByDisplayValue("Nguyễn Xuân")).toBeTruthy();
    expect(screen.getByDisplayValue("Toàn")).toBeTruthy();

    // Nút mở thư viện ảnh và gỡ ảnh
    expect(screen.getByTestId("profile-open-library-button")).toBeTruthy();
    expect(screen.getByTestId("profile-remove-avatar-button")).toBeTruthy();
  });

  it("gửi thông tin cập nhật khi nhấn Lưu thông tin ở Tab thông tin", async () => {
    render(<ProfileDialog user={mockUser} roles={mockRoles} open={true} onOpenChange={vi.fn()} />);

    const lastNameInput = screen.getByTestId("profile-lastname-input");
    fireEvent.change(lastNameInput, { target: { value: "Nguyễn" } });

    const submitBtn = screen.getByTestId("profile-save-info-button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({
        email: "nxtoan2k4@gmail.com",
        username: "toannx",
        firstName: "Toàn",
        lastName: "Nguyễn",
      });
    });
  });

  it("chuyển sang Tab đổi mật khẩu và bắt lỗi khi xác nhận mật khẩu không khớp", async () => {
    render(<ProfileDialog user={mockUser} roles={mockRoles} open={true} onOpenChange={vi.fn()} />);

    // Click tab Đổi mật khẩu
    const securityTab = screen.getByRole("tab", { name: /Bảo mật/i });
    fireEvent.keyDown(securityTab, { key: "Enter" });
    fireEvent.click(securityTab);

    // Điền mật khẩu
    const newPasswordInput = await screen.findByTestId("profile-new-password-input");
    const confirmPasswordInput = screen.getByTestId("profile-confirm-password-input");

    fireEvent.change(newPasswordInput, { target: { value: "StrongPass!123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "WrongPass!123" } });

    const submitBtn = screen.getByTestId("profile-save-password-button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Mật khẩu xác nhận không khớp.")).toBeTruthy();
      expect(mockUpdateAsync).not.toHaveBeenCalled();
    });
  });

  it("kích hoạt gỡ ảnh đại diện khi bấm nút Gỡ ảnh", async () => {
    render(<ProfileDialog user={mockUser} roles={mockRoles} open={true} onOpenChange={vi.fn()} />);

    const removeBtn = screen.getByTestId("profile-remove-avatar-button");
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({ avatarId: null });
    });
  });

  it("mở thư viện ảnh và cập nhật avatar khi chọn file từ thư viện", async () => {
    render(
      <ProfileDialog
        user={mockUser}
        roles={mockRoles}
        open={true}
        onOpenChange={vi.fn()}
        renderAttachmentPicker={({ onSelect }) => (
          <button
            data-testid="mock-select-file"
            onClick={() => onSelect({ id: "new-att-id", url: "https://example.com/new.png" })}
          >
            Chọn ảnh mock
          </button>
        )}
      />,
    );

    const openLibraryBtn = screen.getByTestId("profile-open-library-button");
    fireEvent.click(openLibraryBtn);

    const selectMockFile = screen.getByTestId("mock-select-file");
    fireEvent.click(selectMockFile);

    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({ avatarId: "new-att-id" });
    });
  });
});
