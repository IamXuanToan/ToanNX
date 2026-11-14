import { create } from "zustand";

type AuthStoreState = {
  /** True khi refresh thất bại: phiên đã hết, UI cần đưa người dùng về trang đăng nhập. */
  sessionExpired: boolean;
  /** Đánh dấu phiên hết hạn (gọi từ apiClient, ngoài React). */
  markSessionExpired: () => void;
  /** Xóa cờ sau khi đã xử lý (đăng nhập lại hoặc đã điều hướng). */
  resetSession: () => void;
};

/**
 * Trạng thái phiên phía client. Không lưu token (token nằm trong cookie HttpOnly);
 * dữ liệu người dùng nằm trong React Query (`authKeys.me()`).
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  sessionExpired: false,
  markSessionExpired: () => set({ sessionExpired: true }),
  resetSession: () => set({ sessionExpired: false }),
}));
