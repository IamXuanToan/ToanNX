/**
 * Quyền của tài nguyên Quyên góp (DonationTransaction) theo chuẩn IAM.
 */
export const DONATION_PERMISSIONS = {
  read: "utilities.donation.read",
  update: "utilities.donation.update",
  export: "utilities.donation.export",
  manageAll: "utilities.donation.manage_all",
} as const;
