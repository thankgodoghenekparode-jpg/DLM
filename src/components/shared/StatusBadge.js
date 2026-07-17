const STATUS_CLASSES = {
  PENDING_ASSIGNMENT: "status-pending_assignment",
  ASSIGNED: "status-assigned",
  IN_TRANSIT: "status-in_transit",
  DELIVERED: "status-delivered",
  CANCELLED: "status-cancelled",
  DRAFT: "status-draft",
  CLOSED: "status-closed",
  DISPUTED: "status-disputed",
  ACTIVE: "status-active",
  ON_TRANSIT: "status-on_transit",
  UNDER_MAINTENANCE: "status-under_maintenance",
  INACTIVE: "status-inactive",
  SUSPENDED: "status-suspended",
  DECOMMISSIONED: "status-decommissioned",
};

export default function StatusBadge({ status, className = "" }) {
  const colorClass = STATUS_CLASSES[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
