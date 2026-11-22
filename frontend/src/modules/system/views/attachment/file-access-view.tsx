import { FileAccessGate } from "../../components/attachment/file-access-gate";

/**
 * @param props - Id file.
 * @returns Màn mở file riêng tư theo quyền.
 */
export function FileAccessView({ id }: { id: string }) {
  return <FileAccessGate id={id} />;
}
