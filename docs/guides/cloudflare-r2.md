# Hướng dẫn Cấu hình Cloudflare R2 & Giám sát Dung lượng Thực tế

Tài liệu này hướng dẫn chi tiết cách cấu hình Cloudflare R2 Object Storage cho hệ thống ToanNX và thiết lập API Token để đo lường dung lượng thực tế của bucket theo thời gian thực.

---

## 1. Tổng quan Kiến trúc Lưu trữ

Hệ thống kết hợp 2 chuẩn giao tiếp với Cloudflare R2:

1. **Chuẩn AWS S3 API (`boto3` / `R2Storage`)**:
   - Dùng để tải lên, tải xuống và xóa tệp đính kèm.
   - Phục vụ tệp qua Custom Domain (ví dụ `media.toannx.com`) với chi phí truyền tải **Zero Egress fees**.
   - Xác thực bằng: `CLOUDFLARE_R2_ACCESS_KEY_ID` và `CLOUDFLARE_R2_SECRET_ACCESS_KEY`.
2. **Cloudflare REST API v4 (`R2UsageService`)**:
   - Dùng để truy vấn tức thì dung lượng thực tế đang lưu trữ trên bucket (`payloadSize` + `metadataSize`).
   - Kiểm soát hạn ngạch lưu trữ an toàn (mặc định tối đa **9 GB**, bảo vệ ngưỡng miễn phí **10 GB** của Cloudflare R2 Free Tier).
   - Xác thực bằng: `CLOUDFLARE_API_TOKEN`.

> [!NOTE]
> Chuẩn AWS S3 không hỗ trợ API đơn lẻ nào để lấy tổng dung lượng của toàn bộ bucket. Do đó, hệ thống sử dụng REST API v4 độc quyền của Cloudflare để có dữ liệu chính xác 100% trong thời gian thực mà không phải duyệt quét từng object.

### Cơ chế 2 tầng kiểm soát dung lượng:
- **Tầng 1 (Ưu tiên)**: Khi có `CLOUDFLARE_API_TOKEN`, hệ thống gọi trực tiếp Cloudflare R2 Usage API để lấy dung lượng thực tế trên bucket.
- **Tầng 2 (Fallback an toàn)**: Khi chưa cấu hình token hoặc khi mạng chập chờn/timeout, hệ thống tự động fallback về tính tổng dung lượng của các tệp vật lý chưa dọn dẹp (`purged_at IS NULL`) trong cơ sở dữ liệu PostgreSQL.

---

## 2. Hướng dẫn từng bước lấy Cloudflare API Token

Để hệ thống có thể truy vấn dung lượng bucket, bạn cần tạo một **API Token** (không phải Global API Key) với quyền tối thiểu **R2 Storage: Read**.

### Bước 1: Truy cập trang quản lý API Tokens
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Bấm vào biểu tượng ảnh đại diện ở góc trên cùng bên phải $\rightarrow$ Chọn **My Profile**.
3. Ở menu bên trái, chọn **API Tokens** (hoặc truy cập trực tiếp: `https://dash.cloudflare.com/profile/api-tokens`).

### Bước 2: Tạo Custom Token
1. Bấm vào nút **Create Token**.
2. Cuộn xuống dưới cùng đến mục **Custom Token** $\rightarrow$ Bấm nút **Get started**.

### Bước 3: Cấu hình phân quyền
Thiết lập các trường như sau:

* **Token name**: Đặt tên gợi nhớ, ví dụ: `ToanNX R2 Storage Read`.
* **Permissions** (Phân quyền):
  - Dòng 1: Chọn **Account** $\rightarrow$ Chọn **R2 Storage** $\rightarrow$ Chọn **Read**.
* **Account Resources** (Tài nguyên áp dụng):
  - Chọn **Include** $\rightarrow$ Chọn **Specific account** $\rightarrow$ Chọn đúng tài khoản Cloudflare của bạn (ID tài khoản này phải khớp với `CLOUDFLARE_R2_ACCOUNT_ID`).
* **TTL & IP Filtering** (Thời hạn & IP):
  - Để mặc định hoặc giới hạn dải IP máy chủ nếu cần bảo mật nâng cao.

### Bước 4: Tạo và lưu trữ Token
1. Bấm nút **Continue to summary** ở cuối trang.
2. Kiểm tra lại tóm tắt cấu hình:
   - *Permissions: Account.R2 Storage: Read*
   - *Account Resources: <Tài khoản của bạn>*
3. Bấm **Create Token**.
4. **Sao chép mã Token hiển thị trên màn hình** (mã này có độ dài khoảng 40 ký tự và **chỉ hiển thị một lần duy nhất**).

---

## 3. Kiểm tra Token hoạt động bằng cURL

Bạn có thể chạy thử lệnh sau trong terminal để kiểm tra quyền truy cập:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/<CLOUDFLARE_R2_ACCOUNT_ID>/r2/buckets/<CLOUDFLARE_R2_BUCKET_NAME>/usage" \
     -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
     -H "Content-Type: application/json"
```

Phản hồi mẫu khi thành công:

```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "payloadSize": "345397577",
    "metadataSize": "47700",
    "objectCount": "142",
    "uploadCount": "0",
    "infrequentAccessPayloadSize": "0",
    "infrequentAccessMetadataSize": "0",
    "infrequentAccessObjectCount": "0",
    "infrequentAccessUploadCount": "0"
  }
}
```

Trong đó:
- `payloadSize`: Tổng dung lượng các tệp đối tượng (bytes).
- `metadataSize`: Tổng dung lượng siêu dữ liệu đối tượng (bytes).
- `objectCount`: Tổng số đối tượng đang có trong bucket.

---

## 4. Cấu hình biến môi trường

Thêm các biến môi trường vào file `.env` (cho môi trường local/self-host) hoặc cấu hình trong **Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Environment Variables**:

| Tên biến | Bắt buộc | Mặc định | Mô tả |
| --- | :---: | :---: | --- |
| `FILE_STORAGE_BACKEND` | Có (prod) | `FileSystemStorage` | Đặt `app.core.storage.r2_storage.R2Storage` khi chạy production. |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Có | - | Cloudflare Account ID (32 ký tự hex). |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Có | - | S3 Access Key ID để upload/delete file qua giao thức S3. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Có | - | S3 Secret Access Key. |
| `CLOUDFLARE_R2_BUCKET_NAME` | Có | - | Tên bucket R2 (ví dụ: `toannx-storage`). |
| `CLOUDFLARE_R2_CUSTOM_DOMAIN` | Không | - | Domain tùy chỉnh gắn vào bucket (ví dụ: `media.toannx.com`). |
| `CLOUDFLARE_API_TOKEN` | Khuyên dùng | `""` | API Token quyền `Account: R2 Read` để lấy dung lượng thực tế. |
| `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES` | Không | `9663676416` (9GB) | Hạn ngạch dung lượng tối đa. Vượt ngưỡng này upload sẽ bị từ chối 400. |

### Mẫu cấu hình trong `.env`:

```env
# ==============================================================================
# CLOUDFLARE R2 STORAGE (Object Storage cho Upload Ảnh / Media - Zero Egress Fees)
# ==============================================================================
FILE_STORAGE_BACKEND=app.core.storage.r2_storage.R2Storage
CLOUDFLARE_R2_ACCOUNT_ID=cb8ccac435a7d1c1410f547af13d5d57
CLOUDFLARE_R2_ACCESS_KEY_ID=42d21dd7f1b28c2c5cd33dce94f9060d
CLOUDFLARE_R2_SECRET_ACCESS_KEY=a1290b630177c85a5c7dbe448847aabdf8d0f9cf63bb098bf0bce37b07350d45
CLOUDFLARE_R2_BUCKET_NAME=toannx-storage
CLOUDFLARE_R2_CUSTOM_DOMAIN=media.toannx.com
CLOUDFLARE_R2_ENDPOINT_URL=https://cb8ccac435a7d1c1410f547af13d5d57.r2.cloudflarestorage.com

# Token xác thực Cloudflare REST API v4 để truy vấn dung lượng thực tế của Bucket R2
# Quyền yêu cầu: Account -> R2 Storage -> Read
CLOUDFLARE_API_TOKEN=

# Giới hạn tổng dung lượng lưu trữ hệ thống (bytes). Mặc định 9GB = 9663676416 bytes
ATTACHMENT_MAX_TOTAL_STORAGE_BYTES=9663676416
```

---

## 5. Xử lý sự cố thường gặp

### Lỗi `401 Unauthorized` khi gọi Cloudflare API
* **Nguyên nhân**: Token bị sai, hết hạn, hoặc bị thu hồi.
* **Xử lý**: Kiểm tra lại token tại trang API Tokens của Cloudflare; đảm bảo header có tiền tố `Bearer `.

### Lỗi `10000 Authentication error`
* **Nguyên nhân**: Token không có quyền truy cập vào Account được chỉ định trong URL.
* **Xử lý**: Kiểm tra lại `Account Resources` của Token và đảm bảo `CLOUDFLARE_R2_ACCOUNT_ID` trong cấu hình khớp hoàn toàn với Account ID trên Cloudflare.

### Tải lên bị từ chối với mã lỗi `ATTACHMENT_STORAGE_QUOTA_EXCEEDED`
* **Nguyên nhân**: Tổng dung lượng lưu trữ hiện tại cộng với tệp mới vượt quá `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES` (9GB).
* **Xử lý**:
  1. Kiểm tra dọn dẹp các tệp không còn sử dụng trong Thư viện.
  2. Kích hoạt cron dọn tệp quá hạn `GET /api/v1/system/health/cleanup` để dọn các tệp xóa mềm đã hết hạn lưu trữ (`ATTACHMENT_PURGE_DAYS`).
  3. Nâng dung lượng giới hạn trong biến môi trường `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES` nếu bạn đã nâng cấp gói lưu trữ Cloudflare.
