"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { TICKET_STATUSES, TICKET_PRIORITIES, getLabel } from "@/lib/constants";
import { Package, ImageIcon, MapPin, Loader2, Paperclip } from "lucide-react";

function formatMoney(amount) {
  return `NGN ${Number(amount || 0).toLocaleString()}`;
}

function formatSize(size) {
  if (!size) return "—";
  const values = [size.width, size.length, size.height].map((v) => (v ? Number(v).toLocaleString() : "-"));
  return values.every((v) => v === "-") ? "—" : values.join(" x ");
}

function getTicketAssignment(ticket) {
  if (ticket?.currentAssignment) return ticket.currentAssignment;
  if (!Array.isArray(ticket?.assignments) || ticket.assignments.length === 0) return null;
  return ticket.assignments.find((a) => ["ACCEPTED", "PENDING_DRIVER_RESPONSE", "PENDING"].includes(a.status)) || ticket.assignments[ticket.assignments.length - 1];
}

export default function TicketDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [items, setItems] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showConfirmArrival, setShowConfirmArrival] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignDriverId, setAssignDriverId] = useState("");

  useEffect(() => {
    const load = async () => {
      const [ticketData, itemsData, driverData, vehicleData] = await Promise.all([
        api.get(`/tickets/${id}`).catch(() => null),
        api.get(`/items/ticket/${id}`).catch(() => []),
        api.get("/drivers").catch(() => []),
        api.get("/vehicles").catch(() => []),
      ]);
      if (!ticketData) setError("Failed to load ticket");
      else setTicket(ticketData);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setLoading(false);
    };
    load();
  }, [id]);

  const refreshTicket = async () => {
    const data = await api.get(`/tickets/${id}`).catch(() => null);
    if (data) setTicket(data);
    const itemsData = await api.get(`/items/ticket/${id}`).catch(() => []);
    setItems(Array.isArray(itemsData) ? itemsData : []);
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/start`);
      await refreshTicket();
    } catch (err) {
      alert(err.message || "Failed to start trip");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignVehicleId || !assignDriverId) return;
    setActionLoading(true);
    try {
      if (ticket.status === "DRAFT") {
        await api.post(`/tickets/${id}/submit`);
      }
      await api.patch(`/tickets/${id}/assign`, {
        vehicleId: assignVehicleId,
        driverId: assignDriverId,
      });
      await refreshTicket();
      setShowAssign(false);
    } catch (err) {
      alert(err.message || "Failed to assign");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmArrival = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/confirm-arrival`, {});
      setTicket((prev) => ({ ...prev, status: "ARRIVED" }));
      setShowConfirmArrival(false);
    } catch (err) {
      alert(err.message || "Failed to confirm arrival");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
        <Button variant="secondary" className="mt-3" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-20 text-gray-500 text-sm">Ticket not found</div>;
  }

  const history = ticket.statusHistory || [];
  const assignment = getTicketAssignment(ticket);
  const assignedDriverId = ticket.driverId || assignment?.driverId;
  const assignedVehicleId = ticket.vehicleId || assignment?.vehicleId;
  const assignedDriver = drivers.find((d) => d.id === assignedDriverId);
  const assignedVehicle = vehicles.find((v) => v.id === assignedVehicleId);

  const canStart = ticket.status === "ASSIGNED";
  const canConfirmArrival = ticket.status === "IN_TRANSIT";
  const confirmedArrival = ["ARRIVED", "DELIVERED", "CLOSED"].includes(ticket.status);
  const canAssign = ["DRAFT", "PENDING_ASSIGNMENT"].includes(ticket.status) && !assignedVehicleId;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push("/company/tickets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Tickets</button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber || ticket.id}</h1>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
            {history.map((h, i) => {
              const isCurrent = i === history.length - 1;
              return (
                <div key={i} className="flex items-center gap-1 min-w-0">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap ${isCurrent ? "bg-primary/10 text-primary font-semibold" : "text-gray-700"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{getLabel(TICKET_STATUSES, h.status)}</span>
                    {h.changedAt && <span className="text-gray-400 ml-1 hidden sm:inline">{new Date(h.changedAt).toLocaleString()}</span>}
                  </div>
                  {i < history.length - 1 && <div className="w-6 sm:w-10 h-px bg-primary" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Origin</span><p className="font-medium">{ticket.originAddress || "—"}</p></div>
              <div><span className="text-gray-500">Destination</span><p className="font-medium">{ticket.destinationAddress || "—"}</p></div>
              <div><span className="text-gray-500">Cargo</span><p className="font-medium">{ticket.cargoDescription || "—"}</p></div>
              <div><span className="text-gray-500">Priority</span><p className="font-medium">{ticket.priority ? getLabel(TICKET_PRIORITIES, ticket.priority) : "—"}</p></div>
              <div><span className="text-gray-500">Price</span><p className="font-medium">{ticket.customerPrice ? formatMoney(ticket.customerPrice.amount) : "—"}</p></div>
              <div><span className="text-gray-500">Created</span><p className="font-medium">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Vehicle & Driver</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Vehicle</span><p className="font-medium">{assignedVehicle?.plateNumber || assignedVehicle?.plate || "—"}</p></div>
              <div><span className="text-gray-500">Driver</span><p className="font-medium">{assignedDriver?.fullName || assignedDriver?.name || "—"}</p></div>
            </div>
          </div>

          {ticket.consignee && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Consignee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium">{ticket.consignee.name || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{ticket.consignee.phone || "—"}</p></div>
              </div>
            </div>
          )}

          {ticket.receiver && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Receiver</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium">{ticket.receiver.name || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{ticket.receiver.phone || "—"}</p></div>
                <div><span className="text-gray-500">Address</span><p className="font-medium">{ticket.receiver.address || "—"}</p></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {canAssign && (
                <Button size="sm" disabled={actionLoading} onClick={() => setShowAssign(true)}>
                  Assign Vehicle & Driver
                </Button>
              )}
              {canStart && (
                <Button size="sm" disabled={actionLoading} onClick={handleStartTrip}>
                  {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Start Trip
                </Button>
              )}
              {canConfirmArrival && (
                <Button size="sm" disabled={actionLoading} onClick={() => setShowConfirmArrival(true)}>
                  Confirm Arrival
                </Button>
              )}
              {confirmedArrival && (
                <Button size="sm" disabled>
                  Confirmed
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package size={16} /> Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">No items</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="py-3 space-y-2 px-2 -mx-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-mono">{item.itemNumber || item.id}</span>
                      <span className="text-xs font-medium">{item.weight} kg</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.pictureUrl ? <Image src={item.pictureUrl} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized /> : <ImageIcon size={20} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">Amount: {formatMoney(item.amount)}</p>
                        <p className="text-xs text-gray-500">Size: {formatSize(item.size)}</p>
                        {item.senderName && <p className="text-xs text-gray-400 mt-1">From: {item.senderName}</p>}
                        {item.receiverName && <p className="text-xs text-gray-400">To: {item.receiverName}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Status History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No history</p>
            ) : (
              <div className="space-y-3 text-sm">
                {history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium"><StatusBadge status={h.status} /></p>
                      <p className="text-xs text-gray-500">
                        {h.changedAt ? new Date(h.changedAt).toLocaleString() : "—"}
                        {h.changedBy ? ` by ${h.changedBy}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowAssign(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Vehicle & Driver</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vehicle *</label>
                <select value={assignVehicleId} onChange={(e) => setAssignVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber || v.plate || v.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Driver *</label>
                <select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select driver</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName || d.name} {d.phone ? `(${d.phone})` : ""}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setShowAssign(false)}>Cancel</Button>
              <Button className="flex-1" disabled={actionLoading || !assignVehicleId || !assignDriverId} onClick={handleAssign}>
                {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Assign
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfirmArrival && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowConfirmArrival(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Arrival</h3>
            <p className="text-sm text-gray-500 mb-4">Confirm that this delivery has arrived at the destination?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setShowConfirmArrival(false)}>Cancel</Button>
              <Button className="flex-1" disabled={actionLoading} onClick={handleConfirmArrival}>
                {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
