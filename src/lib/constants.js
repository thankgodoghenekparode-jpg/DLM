export const COMPANY_ROLES = [
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "FLEET_MANAGER", label: "Fleet Manager" },
  { value: "DISPATCH_MANAGER", label: "Dispatch Manager" },
  { value: "BRANCH_ADMIN", label: "Branch Admin" },
];

export const PLATFORM_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PLATFORM_SUPPORT", label: "Platform Support" },
];

export const ALL_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PLATFORM_SUPPORT", label: "Platform Support" },
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "FLEET_MANAGER", label: "Fleet Manager" },
  { value: "DISPATCH_MANAGER", label: "Dispatch Manager" },
  { value: "BRANCH_ADMIN", label: "Branch Admin" },
  { value: "DRIVER", label: "Driver" },
];

export const TENANT_STATUSES = [
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export const KYC_STATUSES = [
  { value: "NOT_SUBMITTED", label: "Not Submitted" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const TICKET_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_ASSIGNMENT", label: "Pending Assignment" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "CLOSED", label: "Closed" },
];

export const TICKET_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export const VEHICLE_OWNERSHIP = [
  { value: "OWNED", label: "Owned" },
  { value: "LEASED", label: "Leased" },
];

export const VEHICLE_TYPES = [
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "TRAILER", label: "Trailer" },
  { value: "BIKE", label: "Bike" },
  { value: "OTHER", label: "Other" },
];

export const VEHICLE_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_TRANSIT", label: "On Transit" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DECOMMISSIONED", label: "Decommissioned" },
];

export const DRIVER_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export const PAYMENT_METHODS = [
  { value: "PAYSTACK", label: "Paystack" },
  { value: "OPAY", label: "OPay" },
];

export const BILLING_INTERVALS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export const WALLET_TX_TYPES = [
  { value: "CREDIT_FUNDING", label: "Credit (Funding)" },
  { value: "CREDIT_ADJUSTMENT", label: "Credit (Adjustment)" },
  { value: "CREDIT_REFUND", label: "Credit (Refund)" },
  { value: "DEBIT_SUBSCRIPTION", label: "Debit (Subscription)" },
  { value: "DEBIT_ADJUSTMENT", label: "Debit (Adjustment)" },
];

export const KYC_DECISIONS = [
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const CHANGE_REQUEST_DECISIONS = [
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const FORMAT_OPTIONS = [
  { value: "json", label: "JSON" },
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
];

export const SUBSCRIPTION_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAST_DUE", label: "Past Due" },
  { value: "GRACE_PERIOD", label: "Grace Period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const ITEM_STATUSES = [
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function getLabel(list, value) {
  const item = list.find((i) => (typeof i === "string" ? i === value : i.value === value));
  if (!item) return value;
  return typeof item === "string" ? item : item.label;
}

export function getValueByLabel(list, label) {
  const item = list.find((i) => (typeof i === "string" ? false : i.label === label));
  return item ? item.value : label;
}

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["platform:dashboard", "platform:companies", "platform:change-requests", "platform:users", "platform:wallets", "platform:plans", "platform:audit-log", "platform:settings", "platform:profile"],
  PLATFORM_SUPPORT: ["platform:dashboard", "platform:companies", "platform:change-requests", "platform:audit-log", "platform:profile"],
  COMPANY_ADMIN: ["company:dashboard", "company:create-parcel", "company:fleet", "company:drivers", "company:tickets", "company:tracker", "company:reports", "company:wallet", "company:branches", "company:users", "company:profile", "company:change-requests", "company:notifications", "company:settings"],
  FLEET_MANAGER: ["company:dashboard", "company:create-parcel", "company:fleet", "company:drivers", "company:tickets", "company:tracker", "company:reports", "company:notifications"],
  DISPATCH_MANAGER: ["company:dashboard", "company:create-parcel", "company:drivers", "company:tickets", "company:tracker", "company:notifications"],
  BRANCH_ADMIN: ["company:dashboard", "company:create-parcel", "company:fleet", "company:drivers", "company:tickets", "company:tracker", "company:notifications"],
  DRIVER: ["driver:trips", "driver:history", "driver:profile", "driver:notifications"],
};

export const PORTAL_ROLES = {
  company: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"],
  platform: ["SUPER_ADMIN", "PLATFORM_SUPPORT"],
  driver: ["DRIVER"],
};
