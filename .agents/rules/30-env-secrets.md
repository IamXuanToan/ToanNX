---
trigger: glob
globs: backend/.env*, frontend/.env*, backend/config/settings.py, frontend/next.config.ts, frontend/src/shares/config/**
description: Quy ước file môi trường, biến env và bí mật.
---

# Môi trường và bí mật

Chi tiết: `docs/rules/common.md` §5, `docs/guides/deployment.md`.

## File env

| File | Dùng cho |
| --- | --- |
| `.env.local` | Local + pytest: PostgreSQL local, storage file, không khóa R2/Upstash, email console |
| `.env` | Production (`toannx.com`, `api.toannx.com`) |
| `.env.example` | Mẫu đủ mọi biến, chú thích tiếng Việt, bí mật để trống |

- Backend có `.env.local` thì **chỉ đọc file đó**. Biến đặt sẵn trong môi trường (Vercel, CI) thắng file.
- **Thêm/đổi/xóa biến** → cập nhật `.env.example` cùng lần: chú thích tiếng Việt phía trên (dùng làm gì, lấy ở đâu,
  để trống thì sao); biến production ghi thêm vào `docs/guides/deployment.md`.
- Biến trống mà cần giá trị mặc định thì code phải tự lấy mặc định (`env.str("X", default="") or "<mặc định>"`),
  vì dòng `X=` trong file cho chuỗi rỗng chứ không lấy `default`.

## Bí mật

- Hệ thống tự tạo và tự kiểm (ký token, băm, mã xác minh) → dẫn xuất từ `DJANGO_SECRET_KEY` bằng
  `django.core.signing` / `salted_hmac` với salt riêng; **không** thêm biến env bí mật mới.
- Bên thứ ba cho cả hệ thống (OAuth secret, `CRON_SECRET`, khóa R2, Firebase service account, Upstash) → biến riêng.
- Token bên thứ ba của từng người dùng (SePay, bot Telegram) → DB, mã hóa bằng `SecretCipher`, không qua env.
- `DJANGO_SECRET_KEY` không rời hệ thống; đổi nó làm hỏng token đã mã hóa (Telegram, SePay) và mọi phiên.
- **Không in giá trị bí mật** ra màn hình, log, báo cáo; kiểm env thì chỉ in tên biến và có/trống.
- Upstash Redis chỉ nhận TLS (`rediss://`); `QSTASH_TOKEN` khác mật khẩu Redis.
- Không tiền tố `toannx` trong tên biến.
