import { create } from "zustand";

type AuthStoreState = {
  /** True khi refresh thất bại: phiên đã hết, UI cần đưa người dùng về trang đăng nhập. */
  sessionExpired: boolean;
  /** True khi người dùng đang thực hiện đăng xuất chủ động, không kích hoạt cảnh báo hết hạn phiên. */
  isLoggingOut: boolean;
  /** Đánh dấu phiên hết hạn (gọi từ apiClient, ngoài React). Bỏ qua nếu đang đăng xuất chủ động. */
  markSessionExpired: () => void;
  /** Bắt đầu luồng đăng xuất chủ động. */
  startLoggingOut: () => void;
  /** Xóa cờ sau khi đã xử lý (đăng nhập lại hoặc đã điều hướng). */
  resetSession: () => void;
};

/**
 * Trạng thái phiên phía client. Không lưu token (token nằm trong cookie HttpOnly);
 * dữ liệu người dùng nằm trong React Query (`authKeys.me()`).
 */
export const useAuthStore = create<AuthStoreState>((set, get) => ({
  sessionExpired: false,
  isLoggingOut: false,
  markSessionExpired: () => {
    if (get().isLoggingOut) return;
    set({ sessionExpired: true });
  },
  startLoggingOut: () => set({ isLoggingOut: true }),
  resetSession: () => set({ sessionExpired: false, isLoggingOut: false }),
}));
