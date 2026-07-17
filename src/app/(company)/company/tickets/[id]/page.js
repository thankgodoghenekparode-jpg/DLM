"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { api } from "@/lib/api";
import { TICKET_STATUSES, TICKET_PRIORITIES, getLabel } from "@/lib/constants";
import { Package, Weight, ImageIcon, MapPin, Loader2, X, Paperclip } from "lucide-react";

export default function TicketDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAttachment, setShowAttachment] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachmentType, setAttachmentType] = useState("DOCUMENT");

  // Cancel modal
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Close modal
  const [showClose, setShowClose] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  // Confirm arrival modal
  const [showConfirmArrival, setShowConfirmArrival] = useState(false);
  const [arrivalName, setArrivalName] = useState("");
  const [arrivalPhone, setArrivalPhone] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState("");
  const [arrivalEmail, setArrivalEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const [ticketData, itemsData] = await Promise.all([
        api.get(`/tickets/${id}`).catch(() => null),
        api.get(`/items/ticket/${id}`).catch(() => []),
      ]);
      if (!ticketData) {
        setError("Failed to load ticket");
      } else {
        setTicket(ticketData);
      }
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setLoading(false);
    };
    load();
  }, [id]);

  const refreshTicket = async () => {
    const [ticketData, itemsData] = await Promise.all([
      api.get(`/tickets/${id}`).catch(() => null),
      api.get(`/items/ticket/${id}`).catch(() => []),
    ]);
    if (ticketData) setTicket(ticketData);
    setItems(Array.isArray(itemsData) ? itemsData : []);
  };

  const handleAttachment = async (file) => {
    if (!file) return;
    setAttaching(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "attachments");
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${api.getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      const uploadData = await uploadRes.json();
      await api.post(`/tickets/${id}/attachments`, {
        type: attachmentType,
        file: { fileName: file.name, fileUrl: uploadData.url },
      });
      setShowAttachment(false);
      setAttachmentType("DOCUMENT");
      alert("Attachment added successfully");
    } catch (err) {
      alert(err.message || "Failed to add attachment");
    } finally {
      setAttaching(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 3) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/cancel`, { reason: cancelReason.trim() });
      await refreshTicket();
      setShowCancel(false);
      setCancelReason("");
    } catch (err) {
      alert(err.message || "Failed to cancel ticket");
    } finally {
      setActionLoading(false);
    }
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

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/close`, { note: closeNote.trim() || undefined });
      await refreshTicket();
      setShowClose(false);
      setCloseNote("");
    } catch (err) {
      alert(err.message || "Failed to close ticket");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!arrivalName.trim() || !arrivalPhone.trim() || !arrivalAddress.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/confirm-arrival`, {
        receiverName: arrivalName.trim(),
        receiverPhone: arrivalPhone.trim(),
        receiverAddress: arrivalAddress.trim(),
        receiverEmail: arrivalEmail.trim() || undefined,
      });
      await refreshTicket();
      setShowConfirmArrival(false);
      setArrivalName("");
      setArrivalPhone("");
      setArrivalAddress("");
      setArrivalEmail("");
    } catch (err) {
      alert(err.message || "Failed to confirm arrival");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push("/company/tickets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Tickets</button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status} />
          </div>
          <span className="text-xs text-gray-400">{ticket.priority && getLabel(TICKET_PRIORITIES, ticket.priority)}</span>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Origin</span><p className="font-medium">{ticket.originAddress || "—"}</p></div>
              <div><span className="text-gray-500">Destination</span><p className="font-medium">{ticket.destinationAddress || "—"}</p></div>
              <div><span className="text-gray-500">Priority</span><p className="font-medium">{ticket.priority ? getLabel(TICKET_PRIORITIES, ticket.priority) : "—"}</p></div>
              <div><span className="text-gray-500">Cargo</span><p className="font-medium">{ticket.cargoDescription || "—"}</p></div>
              <div><span className="text-gray-500">Weight</span><p className="font-medium">{ticket.cargoWeightKg ? `${ticket.cargoWeightKg} kg` : "—"}</p></div>
              <div><span className="text-gray-500">Price</span><p className="font-medium">{ticket.customerPrice ? `₦${ticket.customerPrice.amount?.toLocaleString()}` : "—"}</p></div>
              <div><span className="text-gray-500">Created</span><p className="font-medium">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}</p></div>
              <div><span className="text-gray-500">Pickup</span><p className="font-medium">{ticket.requestedPickupAt ? new Date(ticket.requestedPickupAt).toLocaleString() : "—"}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Vehicle & Driver</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Vehicle ID</span><p className="font-medium">{ticket.vehicleId || "—"}</p></div>
              <div><span className="text-gray-500">Driver ID</span><p className="font-medium">{ticket.driverId || "—"}</p></div>
            </div>
          </div>

          {ticket.consignee && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Consignee</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium">{ticket.consignee.name || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{ticket.consignee.phone || "—"}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Address</span><p className="font-medium">{ticket.consignee.address || "—"}</p></div>
              </div>
            </div>
          )}

          {ticket.receiver && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Receiver</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium">{ticket.receiver.name || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{ticket.receiver.phone || "—"}</p></div>
                <div><span className="text-gray-500">Address</span><p className="font-medium">{ticket.receiver.address || "—"}</p></div>
                {ticket.receiver.email && <div><span className="text-gray-500">Email</span><p className="font-medium">{ticket.receiver.email}</p></div>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {["PENDING_ASSIGNMENT", "ASSIGNED"].includes(ticket.status) && (
                <Button variant="danger" size="sm" disabled={actionLoading} onClick={() => setShowCancel(true)}>Cancel</Button>
              )}
              {ticket.status === "ASSIGNED" && (
                <Button size="sm" disabled={actionLoading} onClick={handleStartTrip}>
                  {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Start Trip
                </Button>
              )}
              {ticket.status === "IN_TRANSIT" && (
                <Button size="sm" disabled={actionLoading} onClick={() => setShowConfirmArrival(true)}>
                  Confirm Arrival
                </Button>
              )}
              {ticket.status === "DELIVERED" && (
                <Button size="sm" disabled={actionLoading} onClick={() => setShowClose(true)}>
                  Close Ticket
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowAttachment(true)}>
                <Paperclip size={14} className="mr-1" /> Attach
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package size={16} /> Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">No items added</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="py-3 space-y-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors px-2 -mx-2" onClick={() => setSelectedItem(item)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-mono">{item.id}</span>
                      <span className="text-xs font-medium">{item.weight} kg</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.pictureUrl ? <Image src={item.pictureUrl} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized /> : <ImageIcon size={20} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">Size: {item.size?.width || 0}×{item.size?.length || 0}×{item.size?.height || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to view details</p>
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

      {/* Item detail modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Item Details">
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedItem.pictureUrl ? <Image src={selectedItem.pictureUrl} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized /> : <ImageIcon size={28} className="text-gray-300" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedItem.description}</p>
                <p className="text-xs text-gray-400 font-mono">{selectedItem.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Weight</span><p className="font-medium">{selectedItem.weight} kg</p></div>
              <div><span className="text-gray-500">Size</span><p className="font-medium">{selectedItem.size?.width || 0}×{selectedItem.size?.length || 0}×{selectedItem.size?.height || 0}</p></div>
              {selectedItem.status && <div className="col-span-2"><span className="text-gray-500">Status</span><p className="font-medium">{selectedItem.status}</p></div>}
            </div>
            {selectedItem.senderName && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><MapPin size={12} /> Sender</p>
                <p className="text-sm font-medium">{selectedItem.senderName}</p>
                <p className="text-xs text-gray-500">{[selectedItem.senderEmail, selectedItem.senderPhone].filter(Boolean).join(" · ")}</p>
              </div>
            )}
            {selectedItem.receiverName && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><MapPin size={12} /> Receiver</p>
                <p className="text-sm font-medium">{selectedItem.receiverName}</p>
                <p className="text-xs text-gray-500">{[selectedItem.receiverEmail, selectedItem.receiverPhone].filter(Boolean).join(" · ")}</p>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <Button className="w-full" onClick={() => setSelectedItem(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Attachment modal */}
      {showAttachment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !attaching && setShowAttachment(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Paperclip size={18} /> Add Attachment</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="DOCUMENT">Document</option>
                  <option value="PHOTO">Photo</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/50">
                  <Paperclip size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Select file</span>
                  <input type="file" className="hidden" disabled={attaching} onChange={(e) => { const f = e.target.files[0]; if (f) handleAttachment(f); }} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" disabled={attaching} onClick={() => setShowAttachment(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowCancel(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Ticket?</h3>
            <p className="text-sm text-gray-500 mb-3">Provide a reason (min 3 characters).</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4" placeholder="Reason for cancellation..." />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setShowCancel(false)}>Keep</Button>
              <Button variant="danger" className="flex-1" disabled={actionLoading || cancelReason.trim().length < 3} onClick={handleCancel}>
                {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {showClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowClose(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Close Ticket?</h3>
            <p className="text-sm text-gray-500 mb-3">Optionally add a closing note.</p>
            <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4" placeholder="Note (optional)..." />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setShowClose(false)}>Cancel</Button>
              <Button className="flex-1" disabled={actionLoading} onClick={handleClose}>
                {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm arrival modal */}
      {showConfirmArrival && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowConfirmArrival(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Arrival</h3>
            <div className="space-y-3 mb-4">
              <input value={arrivalName} onChange={(e) => setArrivalName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver name *" />
              <input value={arrivalPhone} onChange={(e) => setArrivalPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver phone *" />
              <input value={arrivalAddress} onChange={(e) => setArrivalAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver address *" />
              <input value={arrivalEmail} onChange={(e) => setArrivalEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver email (optional)" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setShowConfirmArrival(false)}>Cancel</Button>
              <Button className="flex-1" disabled={actionLoading || !arrivalName.trim() || !arrivalPhone.trim() || !arrivalAddress.trim()} onClick={handleConfirmArrival}>
                {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
