/** Ảnh đã chọn từ Thư viện, giữ id Attachment để gửi về API. */
export type UploadedFile = {
  id: string;
  url: string;
  name: string;
  alt?: string;
  size?: number;
  contentType?: string;
};
