# Data Transfer Objects (DTOs)
# Da Logistics Manager (DLM)

**Document Control**

| Field | Value |
|---|---|
| Product | Da Logistics Manager (DLM) |
| Target Stack | Node.js + TypeScript + Fastify |
| Document Version | 0.1 (Draft) |
| Date | July 3, 2026 |
| Status | Draft — for review |
| Related Documents | `DLM_SRD.md`, `DLM_SDD.md`, `DLM_Screens.md` |

---

## 1. How to Use This Document
These are plain TypeScript types — no framework dependency — intended to be dropped into a backend `src/shared/dto` (shared), per-module `dto.ts` files, and the Next.js frontend `src/types` / `src/lib/schemas` folders. Backend request validation should use Zod (via `fastify-type-provider-zod` or a JSON Schema mapper), and the Next.js frontend should use matching Zod schemas for forms, client-side validation, and API response guards. Enums are declared once and imported everywhere to keep status values consistent across backend, frontend, and driver PWA.

Organized by module, matching `DLM_SRD.md` §3 and `DLM_SDD.md` §4.

---

## 2. Shared / Common Types

```typescript
export type UUID = string;
export type ISODateString = string; // e.g. "2026-07-03T14:22:00Z"

export interface GeoPointDto {
  latitude: number;
  longitude: number;
}

export interface MoneyDto {
  amount: number;      // major unit (Naira) at the API boundary; stored as kobo internally per BR-08
  currency: string;    // ISO 4217, default "NGN"
}

export interface PaginationQueryDto {
  page?: number;      // default 1
  pageSize?: number;  // default 20, max 100
}

export interface PaginatedResponseDto<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiErrorResponseDto {
  statusCode: number;
  error: string;              // machine-readable code, e.g. "VEHICLE_ALREADY_ASSIGNED"
  message: string;            // human-readable
  details?: Record<string, unknown>;
}

export interface AuditMetaDto {
  createdAt: ISODateString;
  createdBy?: UUID;
  updatedAt: ISODateString;
  updatedBy?: UUID;
}

export interface DocumentFileDto {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
}
```

---

## 3. Enums

```typescript
export enum TenantStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

export enum KycStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  FAILED = "FAILED",
}

export enum PlatformRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  PLATFORM_SUPPORT = "PLATFORM_SUPPORT",
}

export enum TenantRole {
  COMPANY_ADMIN = "COMPANY_ADMIN",
  FLEET_MANAGER = "FLEET_MANAGER",
  DISPATCHER = "DISPATCHER",
  FINANCE_OFFICER = "FINANCE_OFFICER",
  DRIVER = "DRIVER",
  VIEWER = "VIEWER",
}

export enum VehicleType {
  TRUCK = "TRUCK",
  VAN = "VAN",
  TRAILER = "TRAILER",
  BIKE = "BIKE",
  OTHER = "OTHER",
}

export enum VehicleOwnership {
  OWNED = "OWNED",
  LEASED = "LEASED",
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  ON_TRANSIT = "ON_TRANSIT",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
  INACTIVE = "INACTIVE",
  DECOMMISSIONED = "DECOMMISSIONED",
}

export enum VehicleDocumentType {
  INSURANCE = "INSURANCE",
  ROADWORTHINESS = "ROADWORTHINESS",
  REGISTRATION = "REGISTRATION",
  OTHER = "OTHER",
}

export enum DriverStatus {
  ACTIVE = "ACTIVE",
  ON_TRIP = "ON_TRIP",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum TicketStatus {
  DRAFT = "DRAFT",
  PENDING_ASSIGNMENT = "PENDING_ASSIGNMENT",
  ASSIGNED = "ASSIGNED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

export enum TicketPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TicketAssignmentStatus {
  PENDING_DRIVER_RESPONSE = "PENDING_DRIVER_RESPONSE",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum TicketAttachmentType {
  WAYBILL = "WAYBILL",
  CUSTOMER_INVOICE = "CUSTOMER_INVOICE",
  POD_PHOTO = "POD_PHOTO",
  OTHER = "OTHER",
}

export enum WalletTransactionType {
  CREDIT_FUNDING = "CREDIT_FUNDING",
  DEBIT_SUBSCRIPTION = "DEBIT_SUBSCRIPTION",
  DEBIT_ADJUSTMENT = "DEBIT_ADJUSTMENT",
  CREDIT_ADJUSTMENT = "CREDIT_ADJUSTMENT",
  CREDIT_REFUND = "CREDIT_REFUND",
}

export enum BillingInterval {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  GRACE_PERIOD = "GRACE_PERIOD",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export enum PaymentProvider {
  PAYSTACK = "PAYSTACK",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  ABANDONED = "ABANDONED",
}

export enum PaymentMethod {
  CARD = "CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  USSD = "USSD",
}

export enum ChangeRequestField {
  COMPANY_NAME = "COMPANY_NAME",
  BRANCH_GEOLOCATION = "BRANCH_GEOLOCATION",
}

export enum ChangeRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export enum NotificationType {
  TICKET_ASSIGNED = "TICKET_ASSIGNED",
  TICKET_ASSIGNMENT_REJECTED = "TICKET_ASSIGNMENT_REJECTED",
  TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  WALLET_LOW_BALANCE = "WALLET_LOW_BALANCE",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  SUBSCRIPTION_PAST_DUE = "SUBSCRIPTION_PAST_DUE",
  DOCUMENT_EXPIRING = "DOCUMENT_EXPIRING",
  CHANGE_REQUEST_UPDATED = "CHANGE_REQUEST_UPDATED",
  TENANT_STATUS_CHANGED = "TENANT_STATUS_CHANGED",
}

export enum SourceProvenance {
  SELF_REGISTERED = "SELF_REGISTERED",
  ADMIN_ENTERED = "ADMIN_ENTERED",
  DRIVER_SUBMITTED = "DRIVER_SUBMITTED",
  SYSTEM_CAPTURED = "SYSTEM_CAPTURED",
  IMPORT = "IMPORT",
}

export enum AuditAction {
  TENANT_KYC_REVIEWED = "TENANT_KYC_REVIEWED",
  TENANT_STATUS_CHANGED = "TENANT_STATUS_CHANGED",
  PLATFORM_USER_INVITED = "PLATFORM_USER_INVITED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  WALLET_ADJUSTED = "WALLET_ADJUSTED",
  TICKET_CANCELLED = "TICKET_CANCELLED",
  LOCKED_FIELD_CHANGED = "LOCKED_FIELD_CHANGED",
  ADMIN_LOGIN = "ADMIN_LOGIN",
  SUPPORT_PII_VIEWED = "SUPPORT_PII_VIEWED",
  SUPPORT_WALLET_VIEWED = "SUPPORT_WALLET_VIEWED",
  SENSITIVE_EXPORT_DOWNLOADED = "SENSITIVE_EXPORT_DOWNLOADED",
}
```

---

## 4. Auth

```typescript
export interface LoginRequestDto {
  identifier: string; // email or phone
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: UserDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequestDto {
  identifier: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}
```

---

## 5. Tenancy & Branch

```typescript
export interface CreateBranchRequestDto {
  name: string;
  address: string;
  geolocation: GeoPointDto;
  phone?: string;
}

export interface BranchDto {
  id: UUID;
  tenantId: UUID;
  name: string;
  address: string;
  geolocation: GeoPointDto; // locked - see ChangeRequestField.BRANCH_GEOLOCATION
  phone?: string;
  sourceProvenance: SourceProvenance;
  createdAt: ISODateString;
}

export interface UpdateBranchRequestDto {
  name?: string;
  address?: string; // textual address is directly editable
  phone?: string;
  // geolocation is intentionally absent - changed only via ChangeRequest
}

export interface RegisterTenantRequestDto {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  cacRegistrationNumber: string;
  cacCertificate: DocumentFileDto;
  tin?: string;
  primaryContact: {
    fullName: string;
    roleTitle: string;
    phone: string;
    email: string;
  };
  password: string;
  primaryBranch: CreateBranchRequestDto;
}

export interface TenantKycDto {
  cacRegistrationNumber: string;
  cacCertificateUrl: string;
  tin?: string;
  primaryContactFullName: string;
  primaryContactRoleTitle: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  emailVerificationStatus: VerificationStatus;
  emailVerifiedAt?: ISODateString;
  phoneVerificationStatus: VerificationStatus;
  phoneVerifiedAt?: ISODateString;
  branchGeolocationVerifiedAt?: ISODateString;
  status: KycStatus;
  reviewedBy?: UUID;
  reviewNote?: string;
  reviewedAt?: ISODateString;
}

export interface TenantDto {
  id: UUID;
  companyName: string; // locked - see ChangeRequestField.COMPANY_NAME
  phone: string;
  email: string;
  address: string;
  kyc: TenantKycDto;
  status: TenantStatus;
  branches: BranchDto[];
  sourceProvenance: SourceProvenance;
  createdAt: ISODateString;
}

export interface UpdateTenantRequestDto {
  phone?: string;
  address?: string;
  email?: string;
  // companyName is intentionally absent - changed only via ChangeRequest
}

export interface ReviewTenantKycRequestDto {
  decision: KycStatus.APPROVED | KycStatus.REJECTED;
  reviewNote?: string;
}

export interface UpdateTenantStatusRequestDto {
  status: TenantStatus.ACTIVE | TenantStatus.SUSPENDED | TenantStatus.DEACTIVATED;
  reason: string;
}
```

---

## 6. Users & RBAC

```typescript
export interface UserDto {
  id: UUID;
  tenantId?: UUID; // undefined for platform users
  fullName: string;
  email: string;
  phone: string;
  role: PlatformRole | TenantRole;
  isActive: boolean;
  createdAt: ISODateString;
}

export interface InviteUserRequestDto {
  fullName: string;
  email: string;
  phone: string;
  role: TenantRole;
}

export interface UpdateUserRoleRequestDto {
  role: TenantRole;
}

export interface InvitePlatformUserRequestDto {
  fullName: string;
  email: string;
  phone: string;
  role: PlatformRole;
}

export interface UpdatePlatformUserRoleRequestDto {
  role: PlatformRole;
}

export interface UpdateUserStatusRequestDto {
  isActive: boolean;
  reason: string;
}
```

---

## 7. Wallet & Billing

```typescript
export interface WalletDto {
  id: UUID;
  tenantId: UUID;
  balance: MoneyDto;
  lowBalanceThreshold: MoneyDto;
  updatedAt: ISODateString;
}

export interface FundWalletRequestDto {
  amount: number;
  currency?: string; // defaults to "NGN"
  paymentMethod: PaymentMethod;
  redirectUrl?: string;
}

export interface FundWalletResponseDto {
  provider: PaymentProvider.PAYSTACK;
  paymentReference: string;
  accessCode?: string;
  checkoutUrl: string;
}

export interface PaymentRecordDto {
  id: UUID;
  tenantId: UUID;
  provider: PaymentProvider;
  providerReference: string;
  amount: MoneyDto;
  status: PaymentStatus;
  initializedAt: ISODateString;
  paidAt?: ISODateString;
}

export interface PaystackWebhookEventDto {
  id: UUID;
  providerEventId?: string;
  event: string;
  reference: string;
  processed: boolean;
  processedAt?: ISODateString;
  receivedAt: ISODateString;
}

export interface WalletTransactionDto {
  id: UUID;
  walletId: UUID;
  type: WalletTransactionType;
  amount: MoneyDto;
  balanceAfter: MoneyDto;
  reference: string;
  relatedSubscriptionId?: UUID;
  relatedPaymentId?: UUID;
  note?: string;
  createdAt: ISODateString;
}

export interface WalletTransactionQueryDto extends PaginationQueryDto {
  type?: WalletTransactionType;
  from?: ISODateString;
  to?: ISODateString;
}

export interface WalletAdjustmentRequestDto {
  // Super Admin only
  tenantId: UUID;
  amount: number;
  type: WalletTransactionType.CREDIT_ADJUSTMENT | WalletTransactionType.DEBIT_ADJUSTMENT;
  reason: string; // mandatory - logged to Audit Log per FR-WAL-07
}

export interface SubscriptionPlanDto {
  id: UUID;
  name: string;
  price: MoneyDto;
  billingInterval: BillingInterval;
  maxVehicles?: number;
  maxDrivers?: number;
  maxTicketsPerMonth?: number;
  gracePeriodDays: number;
  isActive: boolean;
}

export interface UpsertSubscriptionPlanRequestDto {
  name: string;
  price: MoneyDto;
  billingInterval: BillingInterval;
  maxVehicles?: number;
  maxDrivers?: number;
  maxTicketsPerMonth?: number;
  gracePeriodDays: number;
  isActive?: boolean;
}

export interface TenantSubscriptionDto {
  id: UUID;
  tenantId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  currentPeriodStart: ISODateString;
  currentPeriodEnd: ISODateString;
  gracePeriodEndsAt?: ISODateString;
  lastRenewedAt?: ISODateString;
  cancelledAt?: ISODateString;
}

export interface AssignTenantSubscriptionRequestDto {
  tenantId: UUID;
  planId: UUID;
  currentPeriodStart: ISODateString;
  currentPeriodEnd: ISODateString;
}

export interface BillingInvoiceDto {
  id: UUID;
  tenantId: UUID;
  subscriptionId: UUID;
  invoiceNumber: string;
  amount: MoneyDto;
  status: "DRAFT" | "PAID" | "PAST_DUE" | "VOID";
  periodStart: ISODateString;
  periodEnd: ISODateString;
  pdfUrl?: string;
  issuedAt: ISODateString;
  paidAt?: ISODateString;
}
```

---

## 8. Fleet (Carriage)

```typescript
export interface CreateVehicleRequestDto {
  plateNumber: string;
  type: VehicleType;
  makeModel: string;
  capacityTonnage?: number;
  year?: number;
  ownership: VehicleOwnership;
}

export interface UpdateVehicleRequestDto {
  makeModel?: string;
  capacityTonnage?: number;
  status?: VehicleStatus;
  currentDriverId?: UUID;
}

export interface VehicleDocumentDto {
  id: UUID;
  vehicleId: UUID;
  type: VehicleDocumentType;
  documentUrl: string;
  expiresAt?: ISODateString;
}

export interface MaintenanceLogEntryDto {
  id: UUID;
  vehicleId: UUID;
  description: string;
  cost?: MoneyDto;
  performedAt: ISODateString;
}

export interface VehicleDto {
  id: UUID;
  tenantId: UUID;
  plateNumber: string;
  type: VehicleType;
  makeModel: string;
  capacityTonnage?: number;
  year?: number;
  ownership: VehicleOwnership;
  status: VehicleStatus;
  currentDriverId?: UUID;
  documents: VehicleDocumentDto[];
  createdAt: ISODateString;
}
```

---

## 9. Drivers

```typescript
export interface CreateDriverRequestDto {
  fullName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiresAt: ISODateString;
  nin?: string;
  photoUrl?: string;
  joinedAt: ISODateString;
  currentVehicleId?: UUID;
  inviteToApp?: boolean; // if true, provisions a linked mobile-app user
}

export interface UpdateDriverRequestDto {
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiresAt?: ISODateString;
  status?: DriverStatus;
  currentVehicleId?: UUID;
  photoUrl?: string;
}

export interface DriverDto {
  id: UUID;
  tenantId: UUID;
  userId?: UUID;
  fullName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiresAt: ISODateString;
  nin?: string;
  photoUrl?: string;
  status: DriverStatus;
  currentVehicleId?: UUID;
  joinedAt: ISODateString;
  sourceProvenance: SourceProvenance;
  retentionExpiresAt?: ISODateString;
}

export interface DriverPerformanceDto {
  driverId: UUID;
  ticketsCompleted: number;
  onTimeRate: number; // 0-1
  assignmentRejectionCount: number;
  disputeCount: number;
  averageTurnaroundHours: number;
  incidentCount: number;
  averageRating?: number;
}
```

---

## 10. Tickets

```typescript
export interface ConsigneeDto {
  name: string;
  phone: string;
  address: string;
  email?: string;
  sourceProvenance?: SourceProvenance;
}

export interface CreateTicketRequestDto {
  originBranchId?: UUID;
  originAddress: string;
  originGeo?: GeoPointDto;
  destinationAddress: string;
  destinationGeo?: GeoPointDto;
  cargoDescription: string;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  consignee: ConsigneeDto;
  requestedPickupAt: ISODateString;
  priority: TicketPriority;
  customerPrice?: MoneyDto; // Tenant's customer-facing haulage charge; not a DLM platform fee
}

export interface AssignTicketRequestDto {
  vehicleId: UUID;
  driverId: UUID;
  expiresAt?: ISODateString;
  note?: string;
}

export interface TicketAssignmentDto {
  id: UUID;
  ticketId: UUID;
  vehicleId: UUID;
  driverId: UUID;
  status: TicketAssignmentStatus;
  reservesCapacity: boolean; // true while PENDING_DRIVER_RESPONSE or ACCEPTED
  assignedBy: UUID;
  assignedAt: ISODateString;
  respondedAt?: ISODateString;
  responseNote?: string;
  expiresAt?: ISODateString;
}

export interface RespondToTicketAssignmentRequestDto {
  decision: TicketAssignmentStatus.ACCEPTED | TicketAssignmentStatus.REJECTED;
  reason?: string;
}

export interface TicketStatusUpdateRequestDto {
  status: TicketStatus;
  note?: string;
  geoAtUpdate?: GeoPointDto;
}

export interface CancelTicketRequestDto {
  reason: string;
}

export interface CloseTicketRequestDto {
  note?: string;
}

export interface ProofOfDeliveryDto {
  receivedByName: string;
  signatureImageUrl?: string;
  photoUrls: string[];
  deliveredAt: ISODateString;
  notes?: string;
}

export interface SubmitProofOfDeliveryRequestDto extends ProofOfDeliveryDto {}

export interface CreateTicketAttachmentRequestDto {
  type: TicketAttachmentType;
  file: DocumentFileDto;
  note?: string;
}

export interface TicketAttachmentDto {
  id: UUID;
  ticketId: UUID;
  type: TicketAttachmentType;
  file: DocumentFileDto;
  uploadedBy: UUID;
  uploadedAt: ISODateString;
  note?: string;
}

export interface TicketStatusHistoryEntryDto {
  status: TicketStatus;
  changedAt: ISODateString;
  changedBy: UUID;
  note?: string;
}

export interface TicketDto {
  id: UUID;
  tenantId: UUID;
  ticketNumber: string; // human-readable, e.g. "TCK-20260703-0001"
  status: TicketStatus;
  originBranchId?: UUID;
  originAddress: string;
  originGeo?: GeoPointDto;
  destinationAddress: string;
  destinationGeo?: GeoPointDto;
  cargoDescription: string;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  consignee: ConsigneeDto;
  vehicleId?: UUID;
  driverId?: UUID;
  requestedPickupAt: ISODateString;
  priority: TicketPriority;
  customerPrice?: MoneyDto;
  currentAssignment?: TicketAssignmentDto;
  assignments: TicketAssignmentDto[];
  attachments: TicketAttachmentDto[];
  proofOfDelivery?: ProofOfDeliveryDto;
  publicTrackingCode?: string;
  statusHistory: TicketStatusHistoryEntryDto[];
  sourceProvenance: SourceProvenance;
  retentionExpiresAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Limited fields exposed on the public, unauthenticated tracking page
export interface PublicTicketTrackingDto {
  ticketNumber: string;
  status: TicketStatus;
  originCity?: string;
  destinationCity?: string;
  currentLocation?: GeoPointDto;
  eta?: ISODateString;
  lastUpdatedAt: ISODateString;
}
```

---

## 11. Tracker

```typescript
export interface LocationPingRequestDto {
  ticketId: UUID;
  vehicleId: UUID;
  driverId: UUID;
  location: GeoPointDto;
  speedKph?: number;
  headingDegrees?: number;
  recordedAt: ISODateString;
}

export interface LocationPingDto extends LocationPingRequestDto {
  id: UUID;
  tenantId: UUID;
  sourceProvenance: SourceProvenance.SYSTEM_CAPTURED;
  retentionExpiresAt: ISODateString;
}

export interface TicketRouteHistoryDto {
  ticketId: UUID;
  pings: LocationPingDto[];
  totalDistanceKm?: number;
}

export interface ETAResponseDto {
  ticketId: UUID;
  estimatedArrival: ISODateString;
  distanceRemainingKm: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

// Phase 2 - FR-TRK-05
export interface GeofenceAlertDto {
  id: UUID;
  ticketId: UUID;
  type: "ROUTE_DEVIATION" | "ARRIVED_DESTINATION" | "LEFT_ORIGIN";
  triggeredAt: ISODateString;
  location: GeoPointDto;
}
```

---

## 12. Metrics

```typescript
export interface MetricsQueryDto {
  from: ISODateString;
  to: ISODateString;
  branchId?: UUID;
  vehicleId?: UUID;
  driverId?: UUID;
}

export interface TenantMetricsSummaryDto {
  activeTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  fleetUtilizationPercent: number;
  averageTurnaroundHours: number;
  onTimeDeliveryPercent: number;
  walletBalance: MoneyDto;
  periodSpend: MoneyDto;
}

export interface PlatformMetricsSummaryDto {
  totalTenants: number;
  activeTenants: number;
  pendingVerificationTenants: number;
  totalTicketsProcessed: number;
  totalRevenue: MoneyDto;
  tenantGrowthPercent: number;
}

export interface DriverPerformanceReportDto {
  driverId: UUID;
  driverName: string;
  ticketsCompleted: number;
  onTimeRate: number;
  assignmentAcceptanceRate: number;
  assignmentRejectionCount: number;
  disputeCount: number;
  averageTurnaroundHours: number;
  incidentCount: number;
  averageRating?: number;
}

export interface DriverScorecardDto extends DriverPerformanceReportDto {
  periodStart: ISODateString;
  periodEnd: ISODateString;
  rankWithinTenant?: number;
}
```

---

## 13. Notifications

```typescript
export interface NotificationDto {
  id: UUID;
  tenantId?: UUID;
  userId: UUID;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  read: boolean;
  createdAt: ISODateString;
}

export interface NotificationPreferenceDto {
  userId: UUID;
  type: NotificationType;
  channels: NotificationChannel[];
}
```

---

## 14. Change Requests

```typescript
export interface CreateChangeRequestDto {
  field: ChangeRequestField;
  branchId?: UUID; // required when field is BRANCH_GEOLOCATION
  requestedValue: string | GeoPointDto;
  reason: string;
  supportingDocumentUrl?: string;
}

export interface ReviewChangeRequestDto {
  decision: ChangeRequestStatus.APPROVED | ChangeRequestStatus.REJECTED;
  reviewNote?: string;
}

export interface ChangeRequestDto {
  id: UUID;
  tenantId: UUID;
  field: ChangeRequestField;
  branchId?: UUID;
  currentValue: string | GeoPointDto;
  requestedValue: string | GeoPointDto;
  reason: string;
  status: ChangeRequestStatus;
  reviewedBy?: UUID;
  reviewNote?: string;
  createdAt: ISODateString;
  reviewedAt?: ISODateString;
}
```

---

## 15. Audit Log

```typescript
export interface AuditLogEntryDto {
  id: UUID;
  tenantId?: UUID;
  actorUserId: UUID;
  action: AuditAction | string;
  entityType: string;
  entityId: UUID;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface AuditLogQueryDto extends PaginationQueryDto {
  tenantId?: UUID;
  actorUserId?: UUID;
  entityType?: string;
  from?: ISODateString;
  to?: ISODateString;
}
```

---

## 16. Example Usage (Fastify route handler)

```typescript
// modules/ticket/ticket.routes.ts
import { FastifyPluginAsync } from "fastify";
import { CreateTicketRequestDto, TicketDto } from "../../shared/dto";

export const ticketRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CreateTicketRequestDto; Reply: TicketDto }>(
    "/tickets",
    { preHandler: [app.authenticate, app.requireRole(["COMPANY_ADMIN", "DISPATCHER"])] },
    async (request, reply) => {
      const ticket = await request.server.ticketService.create(
        request.tenantId, // injected by the auth/tenant-scope middleware, never from the body
        request.body
      );
      return reply.code(201).send(ticket);
    }
  );
};
```

*(End of DTOs)*
