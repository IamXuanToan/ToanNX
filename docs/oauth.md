# Hướng dẫn cấu hình OAuth (Google & GitHub)

Tài liệu hướng dẫn cấu hình đăng nhập và liên kết tài khoản thông qua Google và GitHub OAuth.

---

## 1. Tổng quan kiến trúc xác thực

Hệ thống hỗ trợ xác thực và liên kết qua OAuth 2.0 theo chuẩn Authorization Code Flow:
1. **Chỉ hỗ trợ đăng nhập & liên kết (Không tự tạo tài khoản mới)**:
   - Nếu tài khoản mạng xã hội chưa được liên kết với user nào trong hệ thống, hệ thống từ chối đăng nhập với mã lỗi `ACCOUNT_SOCIAL_NOT_LINKED` (404) và yêu cầu người dùng đăng nhập bằng mật khẩu trước để liên kết trong **Hồ sơ cá nhân**.
2. **Bảo mật token**:
   - Khi đăng nhập hoặc liên kết thành công, hệ thống chỉ dùng token tạm từ Google/GitHub để đọc thông tin định danh (`uid`, `email`, `display_name`, `avatar_url`) rồi phát hành **phiên đăng nhập JWT riêng của hệ thống** (đặt trong HttpOnly Cookie).
   - Hệ thống không lưu access token của bên thứ 3 vào DB (đảm bảo nếu rò rỉ DB cũng không bị lộ token của user trên Google/GitHub).
3. **Mở rộng**:
   - Khi cần lưu access token/refresh token của Google/GitHub cho mục đích gọi API sau này (Google Drive, GitHub repo...), trường `extra_data` dạng JSON trên model `UserSocialAccount` đã sẵn sàng để lưu trữ.

---

## 2. Cấu hình biến môi trường (`backend/.env`)

Thêm các khóa sau vào file `.env` của backend:

```env
# Google OAuth 2.0
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth App
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
```

---

## 3. Các bước lấy Client ID & Secret

### 3.1. Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn hoặc tạo một Project mới (ví dụ: `ToanNX Platform`).
3. Vào **APIs & Services** → **OAuth consent screen**:
   - Chọn User Type: **External**.
   - Điền App name, User support email, Developer contact email.
   - Thêm các Scopes cơ bản: `openid`, `userinfo.email`, `userinfo.profile`.
4. Vào **APIs & Services** → **Credentials**:
   - Bấm **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ToanNX Web`.
   - **Authorized JavaScript origins**:
     - Local dev: `http://localhost:3001`
     - Production: `https://toannx.com`
   - **Authorized redirect URIs**:
     - Local dev: `http://localhost:3001/auth/callback/google`
     - Production: `https://toannx.com/auth/callback/google`
5. Bấm **Create**, sao chép **Client ID** và **Client Secret** dán vào file `.env` của backend.

---

### 3.2. GitHub Developer Settings
1. Đăng nhập vào GitHub, mở **Settings** → **Developer Settings** → **OAuth Apps**.
2. Bấm **New OAuth App**:
   - **Application name**: `ToanNX Platform`
   - **Homepage URL**: `http://localhost:3001` (hoặc `https://toannx.com`)
   - **Authorization callback URL**:
     - Local dev: `http://localhost:3001/auth/callback/github`
     - Production: `https://toannx.com/auth/callback/github`
3. Bấm **Register application**.
4. Sao chép **Client ID**.
5. Bấm **Generate a new client secret**, nhập mật khẩu xác nhận, sau đó sao chép **Client Secret** dán vào file `.env` của backend.

---

## 4. Kiểm tra hoạt động

- Khi các biến môi trường chưa được set, hệ thống sẽ tự động hiển thị trạng thái `Chưa cấu hình` (`is_configured: false`) trên giao diện và chặn an toàn.
- Khi đã điền đầy đủ Client ID & Secret, hệ thống sẽ chuyển sang trạng thái sẵn sàng để người dùng liên kết và đăng nhập.
