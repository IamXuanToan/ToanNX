export type UploadedFile = {
  id: string;
  url: string;
  name: string;
  size?: number;
  contentType?: string;
};
export type FileUploadOptions = {
  onUpload: (file: File) => Promise<UploadedFile>;
  onChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  formatError: (error: unknown) => string;
  maxFiles?: number;
};
