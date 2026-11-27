"use client";

import { useWarrantyClaim } from "../../../hooks/use-warranty-claim";

/** @returns Query chi tiết Phiếu bảo hành. */
export function useWarrantyClaimDetail(id: string) {
  const query = useWarrantyClaim(id);
  return { query };
}
