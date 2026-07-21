"use client";

import { use, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import { Clock, Phone, Camera, CheckCircle, Loader2, AlertCircle, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { api } from "@/lib/api";
import { getLabel, TICKET_STATUSES } from "@/lib/constants";

export default function DriverTripDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [showPOD, setShowPOD] = useState(false);
  const [podImage, setPodImage] = useState(null);
  const [podFile, setPodFile] = useState(null);
  const [podNotes, setPodNotes] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [submittingPOD, setSubmittingPOD] = useState(false);
  const [showRespond, setShowRespond] = useState(false);
  const [respondDecision, setRespondDecision] = useState(null);
  const [respondReason, setRespondReason] = useState("");
  const [responding, setResponding] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTicket();
  }, [fetchTicket]);

  const pendingAssignment = ticket?.assignments?.find((a) => a.status === "PENDING_DRIVER_RESPONSE");

  const handleRespond = async () => {
    if (!pendingAssignment) return;
    setResponding(true);
    try {
      const body = { decision: respondDecision };
      if (respondDecision === "REJECTED" && respondReason.trim()) body.reason = respondReason.trim();
      const updated = await api.post(`/tickets/${id}/assignments/${pendingAssignment.id}/respond`, body);
      setTicket(updated);
      setShowRespond(false);
      setRespondDecision(null);
      setRespondReason("");
    } catch (err) {
      alert(err.message);
    } finally {
      setResponding(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      setStarting(true);
      const updated = await api.patch(`/tickets/${id}/start`);
      setTicket(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handlePODUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPodFile(file);
      setPodImage(URL.createObjectURL(file));
    }
  };

  const handleSubmitPOD = async () => {
    if (!receivedByName.trim()) {
      alert("Please enter the receiver's name");
      return;
    }
    try {
      setSubmittingPOD(true);
      const body = {
        receivedByName: receivedByName.trim(),
        photoUrls: [],
        deliveredAt: new Date().toISOString(),
        notes: podNotes.trim() || undefined,
      };
      if (podFile) {
        const formData = new FormData();
        formData.append("file", podFile);
        formData.append("folder", "pod");
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${api.getToken()}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(err.message || "Photo upload failed");
        }
        const uploadData = await uploadRes.json();
        body.photoUrls = [uploadData.url];
      }
      const updated = await api.post(`/tickets/${id}/pod`, body);
      setTicket(updated);
      setShowPOD(false);
      setPodImage(null);
      setPodFile(null);
      setPodNotes("");
      setReceivedByName("");
      alert("POD submitted successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPOD(false);
    }
  };

  const stepIndex = ticket
    ? ["ASSIGNED", "IN_TRANSIT", "DELIVERED"].indexOf(ticket.status)
    : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push("/driver/trips")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          ← My Trips
        </button>
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading trip...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertCircle size={20} className="mr-2" />
            {error}
            <button onClick={fetchTicket} className="ml-3 text-sm underline">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && ticket && (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 overflow-x-auto pb-2">
              {["Assigned", "In Transit", "Delivered"].map((step, i) => (
                <span key={step} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      i <= stepIndex ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i === stepIndex ? "text-primary font-medium" : ""}>{step}</span>
                  {i < 2 && <span className="text-gray-300">→</span>}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} /> Trip Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-500">Route</span>
                      <p className="font-medium">{ticket.originAddress} → {ticket.destinationAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Origin</span>
                      <p className="font-medium">{ticket.originAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Destination</span>
                      <p className="font-medium">{ticket.destinationAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cargo</span>
                      <p className="font-medium">{ticket.cargoDescription}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">ETA</span>
                      <p className="font-medium">
                        {ticket.etaMinutes != null ? `${ticket.etaMinutes} min` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                {ticket.consignee && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone size={16} /> Consignee
                    </h3>
                    <p className="text-sm font-medium">{ticket.consignee.name || ticket.consignee}</p>
                    {ticket.consignee.phone && (
                      <a href={`tel:${ticket.consignee.phone}`} className="text-sm text-primary hover:underline">
                        {ticket.consignee.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
                  <div className="space-y-2">
                    {pendingAssignment && (
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => { setRespondDecision("ACCEPTED"); setShowRespond(true); }}>
                          <ThumbsUp size={16} className="mr-1" /> Accept
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={() => { setRespondDecision("REJECTED"); setShowRespond(true); }}>
                          <ThumbsDown size={16} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {ticket.status === "ASSIGNED" && !pendingAssignment && (
                      <Button className="w-full" onClick={handleStartTrip} disabled={starting}>
                        {starting ? <Loader2 size={16} className="mr-1 animate-spin" /> : <CheckCircle size={16} className="mr-1" />}
                        {starting ? "Starting..." : "Start Trip"}
                      </Button>
                    )}
                    {ticket.status === "IN_TRANSIT" && (
                      <Button className="w-full" onClick={() => setShowPOD(true)}>
                        <Camera size={16} className="mr-1" /> Upload POD
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full" onClick={() => alert("Calling dispatch...")}>
                      <Phone size={16} className="mr-1" /> Contact Dispatch
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showRespond && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!responding) { setShowRespond(false); setRespondDecision(null); setRespondReason(""); } }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{respondDecision === "ACCEPTED" ? "Accept Assignment" : "Reject Assignment"}</h3>
              <button onClick={() => { setShowRespond(false); setRespondDecision(null); setRespondReason(""); }}><X size={18} className="text-gray-400" /></button>
            </div>
            {respondDecision === "REJECTED" && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Reason *</label>
                <textarea value={respondReason} onChange={(e) => setRespondReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Why are you rejecting this trip?" />
              </div>
            )}
            {respondDecision === "ACCEPTED" && (
              <p className="text-sm text-gray-500 mb-4">You are about to accept this trip assignment.</p>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={responding} onClick={() => { setShowRespond(false); setRespondDecision(null); setRespondReason(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleRespond} disabled={responding || (respondDecision === "REJECTED" && !respondReason.trim())}>
                {responding ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {respondDecision === "ACCEPTED" ? "Accept" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPOD && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPOD(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={20} /> Upload Proof of Delivery
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name *</label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter receiver's name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Optional delivery notes"
                  rows={2}
                />
              </div>
              {podImage ? (
                <div>
                  <Image src={podImage} alt="POD" width={400} height={192} className="w-full h-48 object-cover rounded-lg mb-3" unoptimized />
                  <Button className="w-full" onClick={handleSubmitPOD} disabled={submittingPOD}>
                    {submittingPOD ? <Loader2 size={16} className="mr-1 animate-spin" /> : null}
                    {submittingPOD ? "Submitting..." : "Submit POD"}
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/50">
                    <Camera size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Tap to take a photo</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePODUpload} />
                  </label>
                  <Button className="w-full mt-3" onClick={handleSubmitPOD} disabled={submittingPOD}>
                    {submittingPOD ? <Loader2 size={16} className="mr-1 animate-spin" /> : null}
                    {submittingPOD ? "Submitting..." : "Submit without photo"}
                  </Button>
                </div>
              )}
              <Button variant="secondary" className="w-full" onClick={() => setShowPOD(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
