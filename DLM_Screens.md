# Screens Specification
# Da Logistics Manager (DLM)

**Document Control**

| Field | Value |
|---|---|
| Product | Da Logistics Manager (DLM) |
| Document Version | 0.1 (Draft) |
| Date | July 3, 2026 |
| Status | Draft — for review |
| Related Documents | `DLM_SRD.md`, `DLM_SDD.md`, `DLM_DTOs.md` |

---

## 1. Purpose
This document inventories every screen across DLM's three clients — the Super Admin Portal, the Company Portal, and the Driver App — plus the public tracking page. For each screen: purpose, key elements, primary actions, and which roles can access it. Layout sketches are included for the highest-value screens; the rest are specified at inventory level, ready for high-fidelity design (Figma or similar) as a next step.

---

## 2. Super Admin Portal (Web) — Zarox IT Solutions

| # | Screen | Purpose | Key Elements | Primary Actions | Roles |
|---|---|---|---|---|---|
| SA-1 | Login | Authenticate platform staff | Email/phone + password | Log in | All platform roles |
| SA-2 | Platform Dashboard | Platform-wide health at a glance | KPI cards (tenants, tickets, revenue), growth chart, system health | View, drill down | Super Admin, Platform Support |
| SA-3 | Tenant List | Browse/search all tenants | Table: name, status, branches, wallet balance; filters | Search, filter, open tenant | Super Admin, Platform Support |
| SA-4 | Tenant Detail | Full view of one tenant | Profile, KYC summary, branches, users, wallet, recent tickets, activity log | Suspend/reactivate, open change requests | Super Admin; Platform Support (read-only) |
| SA-5 | Tenant Onboarding Review | Approve/reject new registrations | Submitted profile, CAC number, CAC certificate, primary contact, email/phone verification, branch geolocation | Approve, reject (reason) | Super Admin |
| SA-6 | Change Request Queue | Review locked-field change requests | List + detail: field, current vs requested value, reason | Approve, reject (note) | Super Admin |
| SA-7 | Platform Users | Manage Zarox staff accounts | User table, invite form, active/inactive status | Invite, deactivate, change role | Super Admin; Platform Support (view-only) |
| SA-8 | Wallet Oversight | Cross-tenant wallet visibility | Table of all wallets, transaction drill-down, Paystack reference/status | View, manual adjustment (reason required) | Super Admin; Platform Support (view-only) |
| SA-9 | Plan / Billing Management | Manage subscription plans | Plan list (price, billing interval, grace period), tenant subscription status | Create/edit plan, assign to tenant, retry renewal | Super Admin |
| SA-10 | Audit Log Viewer | Investigate sensitive actions and sensitive support reads | Filterable table (actor, tenant, entity, action, date) | Search, filter, export | Super Admin; Platform Support (view-only) |
| SA-11 | System Settings | Global configuration | Notification templates, low-balance thresholds, Paystack/SMS/email integration settings | Edit, save | Super Admin |

### Layout sketch — SA-4 Tenant Detail
```
+-------------------------------------------------------------+
| < Tenants   |  ACME Haulage Ltd.        [ACTIVE]  [Suspend]  |
+-------------------------------------------------------------+
| Tabs: Profile | Branches | Users | Wallet | Tickets | Activity|
+-------------------------------------------------------------+
|  Profile tab:                                                |
|   Company Name: ACME Haulage Ltd.        [locked - change req]|
|   Phone: 0803...            Address: ...                     |
|   Registered: 12 Mar 2026    CAC No: RC-XXXXXX                |
|   Branches: [Lagos HQ] [Kano Depot]     [geolocation locked]  |
+-------------------------------------------------------------+
```

---

## 3. Company Portal (Web) — Logistics Company Tenant

| # | Screen | Purpose | Key Elements | Primary Actions | Roles |
|---|---|---|---|---|---|
| CO-1 | Login | Authenticate tenant users | Email/phone + password | Log in | All tenant roles |
| CO-2 | Registration Wizard | New tenant sign-up | Company info + CAC/KYC → branch + geolocation (map picker) → primary admin password | Submit for verification | Prospective Company Admin |
| CO-2a | Registration Status | Show pending/rejected onboarding state | Submitted details, review status, rejection reason if any | Edit allowed fields, resubmit if rejected | Prospective Company Admin |
| CO-3 | Company Dashboard | Operational overview | KPI cards, tickets-over-time chart, mini live map, recent tickets table | View, drill down | Admin, Fleet Manager, Dispatcher, Finance, Viewer (scoped) |
| CO-4 | Company Profile & Branches | View/manage tenant profile | Locked fields marked; editable fields inline | Edit (non-locked), submit change request | Company Admin |
| CO-5 | User Management | Manage tenant team | User table + role | Invite user, change role, deactivate | Company Admin |
| CO-6 | Wallet & Funding | Manage tenant funds | Balance, subscription status, Paystack fund button, transaction table, invoices/statements | Fund wallet, download statement/invoice | Company Admin, Finance Officer |
| CO-6a | Payment Result | Confirm Paystack return state | Success/pending/failed message, payment reference, wallet update status | Return to wallet, retry failed payment | Company Admin, Finance Officer |
| CO-7 | Fleet List | Browse vehicles | Table: plate, type, status, current driver, doc-expiry flags | Search, filter, add vehicle | Admin, Fleet Manager |
| CO-8 | Vehicle Detail | Full vehicle record | Profile, documents, maintenance log, assignment history | Edit, add maintenance entry, upload document | Admin, Fleet Manager |
| CO-9 | Add / Edit Vehicle | Create or update a vehicle | Form: plate, type, make/model, capacity | Save | Admin, Fleet Manager |
| CO-10 | Drivers List | Browse drivers | Table: name, phone, status, license expiry flag | Search, filter, add driver | Admin, Fleet Manager |
| CO-11 | Driver Detail | Full driver record | Profile, documents, performance history, ticket history | Edit, invite to app, suspend | Admin, Fleet Manager |
| CO-12 | Add / Edit Driver | Create or update a driver | Form: name, phone, license, NIN | Save, invite to mobile app | Admin, Fleet Manager |
| CO-13 | Tickets Board | Manage all tickets | Kanban by status + table view; filters | Create, assign, cancel | Admin, Dispatcher |
| CO-14 | Create Ticket | New job order | Form: origin/destination (map), cargo, consignee, priority | Save as draft, submit | Admin, Dispatcher |
| CO-15 | Ticket Detail | Full ticket record | Status timeline, assignment accept/reject state, assigned vehicle/driver, cargo info, embedded live map, POD | Assign, close delivered ticket, cancel, attach doc | Admin, Dispatcher, Viewer |
| CO-16 | Live Tracker Map | All in-transit vehicles at once | Full-screen map, vehicle pins, side list | Select vehicle, open ticket | Admin, Fleet Manager, Dispatcher |
| CO-17 | Reports & Analytics | Deeper metrics slicing | Filterable charts/tables | Filter, export CSV/PDF | Admin, Finance, Viewer |
| CO-18 | Change Requests (Tenant view) | Track submitted requests | List + status | Submit new, view status | Company Admin |
| CO-19 | Notifications Center | All notifications | List, read/unread | Mark read, open source item | All tenant roles |
| CO-20 | Settings | Branch & preference management | Branch list, notification preferences | Add branch, edit preferences | Company Admin |
| CO-21 | Subscription Blocked | Explain access restriction when subscription is past due beyond grace | Subscription status, wallet balance, amount due, fund button | Fund wallet, contact support | Company Admin, Finance Officer |

### Layout sketch — CO-3 Company Dashboard
```
+------------------------------------------------------------------+
| Logo   Branch: [All]     Wallet: NGN 482,300   Notif:3   Daniel  |
+----------+---------------------------------------------------------+
| Side nav |  Active Tickets: 14   Completed (7d): 62  Fleet Util: 71%|
|  Dash    |  On-time: 94%                                           |
|  Fleet   |  +------------------------+  +----------------------+   |
|  Drivers |  | Tickets over time      |  | Wallet spend trend   |   |
|  Tickets |  +------------------------+  +----------------------+   |
|  Tracker |  Recent Tickets                                         |
|  Reports |  TCK-...01  Lagos->Ibadan  IN_TRANSIT  Driver: Musa      |
|  Wallet  |  TCK-...02  Kano->Abuja    DELIVERED   Driver: Chidi     |
|  Users   |  +------------------------+                             |
|  Settings|  | Mini map - in-transit  |                             |
+----------+--+------------------------+-----------------------------+
```

### Layout sketch — CO-15 Ticket Detail
```
+--------------------------------------------------------------------+
| < Tickets   TCK-20260703-0014          [IN_TRANSIT]                |
+--------------------------------------------------------------------+
| Status timeline: Draft > Assigned > In Transit (current) > Delivered|
+---------------------------+----------------------------------------+
| Cargo: 4.2t general goods |  Live map                               |
| Origin: Lagos HQ          |  [vehicle pin animating along route]    |
| Destination: Ibadan Depot |  ETA: 47 min                            |
| Vehicle: KJA-224-XY       |                                         |
| Driver: Musa Aliyu        |                                         |
| Consignee: Femi Store     |                                         |
+---------------------------+----------------------------------------+
| [Cancel Ticket]   [Attach Document]   [Contact Driver] [Close Ticket]|
+--------------------------------------------------------------------+
```

### Layout sketch — CO-14 Create Ticket
```
+----------------------------------------------------+
| New Ticket                                          |
+----------------------------------------------------+
| Origin branch:  [Lagos HQ]   or pin on map           |
| Destination:    [map picker / address search]        |
| Cargo description: [____________________]            |
| Weight (kg): [____]   Volume (m3): [____]             |
| Consignee name/phone/address: [____________]          |
| Requested pickup: [date/time picker]                  |
| Priority: (Low) (Normal) (High) (Urgent)               |
| Price: NGN [_______]                                   |
|                          [Save as Draft] [Submit]      |
+----------------------------------------------------+
```

---

## 4. Driver Mobile App / PWA

| # | Screen | Purpose | Key Elements | Primary Actions | Roles |
|---|---|---|---|---|---|
| DR-1 | Login | Authenticate driver | Phone + password (or OTP) | Log in | Driver |
| DR-1a | App Setup & Permissions | Prepare PWA for trip execution | Install prompt, GPS permission, camera permission, offline-sync status | Install, allow permissions, retry permission check | Driver |
| DR-2 | Today's Tickets | List of assigned tickets | Cards: pickup time, destination, status | Open ticket | Driver |
| DR-3 | Ticket Detail | Full job info | Cargo, consignee, route preview, rejection reason field | Accept / Reject | Driver |
| DR-4 | Active Trip | In-progress trip screen | Live map, next checkpoint, call consignee | Start trip, mark checkpoint, mark delivered | Driver |
| DR-5 | Proof of Delivery | Capture delivery confirmation | Camera (photo), signature pad, receiver name | Submit POD | Driver |
| DR-6 | Trip History | Past completed trips | List with dates/status | View past ticket | Driver |
| DR-7 | Profile | View own driver profile | Name, phone, license (read-only), vehicle | View, request edit | Driver |
| DR-8 | Notifications | Driver-facing alerts | List | Mark read | Driver |
| DR-9 | Offline Queue | Show unsynced trip updates | Pending location pings, POD uploads, retry state | Retry sync | Driver |

### Layout sketch — DR-4 Active Trip
```
+-------------------------------+
|  TCK-20260703-0014             |
|  Lagos HQ -> Ibadan Depot      |
+-------------------------------+
|                                 |
|         [ live map ]           |
|                                 |
+-------------------------------+
| ETA: 47 min   Distance: 38 km  |
| [ Call Consignee ]              |
| [   Mark as Delivered   ]       |
+-------------------------------+
```

---

## 5. Public (No Login)

| # | Screen | Purpose | Key Elements | Primary Actions | Access |
|---|---|---|---|---|---|
| PB-1 | Shareable Tracking Page | Let a consignee follow their shipment | Ticket status, simplified live map (while in transit), ETA | View only | Anyone with the tracking link |
| PB-2 | Invalid / Expired Tracking Link | Handle bad or disabled links safely | Generic not-found/expired message, no tenant or consignee PII | View only | Anyone with the tracking link |

---

## 6. Cross-Cutting UI Notes
- **Locked-field indicator**: any field that requires a Change Request (Company Name, Branch Geolocation) is shown with a lock icon and opens the Change Request form instead of an inline editor.
- **Status colors**: consistent status-to-color mapping applied across Tickets, Vehicles, and Drivers wherever a status badge appears.
- **Empty states**: every list screen (Fleet, Drivers, Tickets) needs a designed empty state for first-time tenants with zero records, with a direct call-to-action to create the first one.
- **Subscription gating**: if subscription payment is past due beyond the grace period, block new ticket creation with a clear route to fund the wallet; do not block completion of active trips.
- **Payment states**: wallet funding must show Paystack success, pending, failed, and webhook-delayed states without double-crediting the wallet in the UI.
- **Driver PWA constraints**: location tracking requires explicit browser permission and is most reliable while the PWA is active/foreground. Offline updates queue locally and sync when connectivity returns.
- **Mobile responsiveness**: Company Portal should degrade gracefully to tablet width; full mobile-first design is scoped to the Driver App specifically rather than the dashboards.

---

## 7. Suggested Next Step
This document specifies screens at inventory + key-flow depth. The natural next step is high-fidelity mockups for the screens with layout sketches above, followed by the remaining list-format screens.

*(End of Screens Specification)*
