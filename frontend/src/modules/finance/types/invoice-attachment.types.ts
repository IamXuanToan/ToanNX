/** File chứng từ (BE `AttachmentDetailResponseSerializer`, kho riêng tư). */
export type InvoiceAttachment = {
  id: string;
  url: string;
  visibility: string;
  originalName: string;
  contentType: string;
  size: number;
};
