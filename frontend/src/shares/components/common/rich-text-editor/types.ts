/** Props editor chung; module sở hữu dữ liệu, quyền truy cập và việc chọn/upload ảnh. */
export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  label: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onSelectImage?: () => Promise<{ url: string; alt: string } | null>;
};
