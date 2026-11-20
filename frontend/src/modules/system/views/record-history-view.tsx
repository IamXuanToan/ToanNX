import type { MessageKey } from "@/shares/types/navigation.types";

import { RecordHistory } from "../components/record-history";

/**
 * Lịch sử thay đổi của một bản ghi, ghép vào trang chi tiết của module khác qua slot `history`.
 *
 * @param props - Path `…/{id}/history` và tiền tố nhãn field.
 * @returns Card lịch sử.
 */
export function RecordHistoryView({
  path,
  fieldPrefix,
}: {
  path: string;
  fieldPrefix: MessageKey;
}) {
  return <RecordHistory path={path} fieldPrefix={fieldPrefix} />;
}
