"use client";

import { SubscriptionPaymentTable } from "../subscription-payment/subscription-payment-table";

/**
 * Tab Lịch sử gia hạn bên trong trang Chi tiết Dịch vụ định kỳ:
 * tái sử dụng `SubscriptionPaymentTable` (tìm kiếm, sắp xếp, xóa, xóa hàng loạt) khóa theo dịch vụ.
 *
 * @param props - ID dịch vụ định kỳ và quyền xóa bản ghi gia hạn.
 * @returns Bảng các kỳ thanh toán đã ghi nhận của dịch vụ.
 */
export function SubscriptionPaymentsTab({
  subscriptionId,
  canDelete = false,
}: {
  subscriptionId: string;
  canDelete?: boolean;
}) {
  return <SubscriptionPaymentTable subscriptionId={subscriptionId} canDelete={canDelete} />;
}
