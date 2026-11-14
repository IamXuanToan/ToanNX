/** File đã upload (`POST /attachments`). `url` là URL tuyệt đối, dùng trực tiếp. */
export type Attachment = {
  id: string;
  url: string;
  originalName: string;
  /** MIME type do backend nhận diện từ nội dung file (không tin header client). */
  contentType: string;
  size: number;
  createdAt: string;
};
