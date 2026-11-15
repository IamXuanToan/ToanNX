import { createResourceKeys } from "@/shares/lib/api/resource-keys";

const codes = createResourceKeys("qr-codes", "codes");

/** Query key React Query của module QR Codes. */
export const qrCodeKeys = {
  ...codes,
  banks: () => ["qr-codes", "banks"] as const,
  preview: (input: object) => ["qr-codes", "preview", input] as const,
};
