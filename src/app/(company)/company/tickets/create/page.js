"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plus, Trash2, Package, Weight, Ruler, Loader2, CheckCircle, User, MapPin, ImageIcon } from "lucide-react";

function branchLabel(branch) {
  return [branch.name, branch.address].filter(Boolean).join(" - ") || branch.id;
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function buildOptionalSize(item) {
  const size = {
    width: optionalNumber(item.sizeW),
    length: optionalNumber(item.sizeL),
    height: optionalNumber(item.sizeH),
  };
  return Object.values(size).some((v) => v !== undefined) ? size : undefined;
}

const emptyForm = {
  description: "",
  weight: "",
  amount: "",
  sizeW: "",
  sizeL: "",
  sizeH: "",
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  receiverName: "",
  receiverPhone: "",
  receiverEmail: "",
};

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [branches, setBranches] = useState([]);
  const [originBranchId, setOriginBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);
  const [lastTicketNumber, setLastTicketNumber] = useState(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.get(`/tenants/${user.tenantId}`)
      .then((data) => setBranches(Array.isArray(data?.branches) ? data.branches : []))
      .catch(() => setBranches([]));
  }, [user?.tenantId]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const uploadImage = async (file) => {
    if (!file) return null;
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "items");
    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api.getToken()}` },
      body: data,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(err.message || "Upload failed");
    }
    return (await uploadRes.json()).url;
  };

  const handleAddItem = async () => {
    setError(null);
    if (!originBranchId || !destinationBranchId) { setError("Select origin and destination branches first"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }
    if (!optionalNumber(form.weight)) { setError("Weight must be a positive number"); return; }
    if (!optionalNumber(form.amount)) { setError("Amount must be a positive number"); return; }

    setSubmitting(true);
    try {
      const originBranch = branches.find((b) => b.id === originBranchId);
      const destBranch = branches.find((b) => b.id === destinationBranchId);

      const ticket = await api.post("/tickets", {
        originBranchId,
        originAddress: originBranch?.address || originBranch?.name || "",
        destinationBranchId,
        destinationAddress: destBranch?.address || destBranch?.name || "",
      });

      let pictureUrl = null;
      try { pictureUrl = await uploadImage(imageFile); } catch { pictureUrl = null; }

      const payload = {
        ticketId: ticket.id,
        description: form.description.trim(),
        weight: Number(form.weight),
        amount: Number(form.amount),
        senderName: form.senderName.trim() || user?.fullName || "",
        senderPhone: form.senderPhone.trim() || user?.phone || "",
        senderEmail: form.senderEmail.trim() || user?.email || "",
        receiverName: form.receiverName.trim() || "",
        receiverPhone: form.receiverPhone.trim() || "",
        receiverEmail: form.receiverEmail.trim() || "",
      };
      const size = buildOptionalSize(form);
      if (size) payload.size = size;
      if (pictureUrl) payload.pictureUrl = pictureUrl;

      const item = await api.post("/items", payload);

      setItems((prev) => [...prev, {
        ticketNumber: ticket.ticketNumber,
        itemNumber: item.itemNumber,
        ticketId: ticket.id,
        description: form.description.trim(),
        weight: form.weight,
        amount: form.amount,
        senderName: form.senderName.trim() || user?.fullName,
        receiverName: form.receiverName.trim(),
      }]);
      setLastTicketNumber(ticket.ticketNumber);
      setForm(emptyForm);
      setImageFile(null);
    } catch (err) {
      setError(err.message || "Failed to create waybill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveItem = async (index) => {
    const item = items[index];
    if (!item) return;
    try {
      await api.patch(`/tickets/${item.ticketId}/cancel`, { reason: "Removed" });
    } catch {}
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push("/company/tickets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <ArrowLeft size={14} /> Tickets
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add Parcel</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in details and click Add to create a waybill per item</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {lastTicketNumber && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 mb-1">Last created — give this to customer</p>
          <p className="text-lg font-bold font-mono text-green-700">{lastTicketNumber}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Origin Branch *</label>
            <select value={originBranchId} onChange={(e) => setOriginBranchId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white">
              <option value="">Select origin</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{branchLabel(b)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Destination Branch *</label>
            <select value={destinationBranchId} onChange={(e) => setDestinationBranchId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white">
              <option value="">Select destination</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{branchLabel(b)}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Package size={12} /> Item Details</h3>
          <div>
            <label className="text-xs text-gray-500">Description *</label>
            <input value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Samsung TV" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1"><Weight size={10} /> Weight (kg) *</label>
              <input type="number" step="0.1" min="0" value={form.weight} onChange={(e) => updateForm("weight", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0.0" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount (NGN) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => updateForm("amount", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> W</label>
              <input type="number" step="0.01" min="0" value={form.sizeW} onChange={(e) => updateForm("sizeW", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="cm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> L</label>
              <input type="number" step="0.01" min="0" value={form.sizeL} onChange={(e) => updateForm("sizeL", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="cm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> H</label>
              <input type="number" step="0.01" min="0" value={form.sizeH} onChange={(e) => updateForm("sizeH", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="cm" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1"><User size={12} /> Sender</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.senderName} onChange={(e) => updateForm("senderName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" />
            <input value={form.senderPhone} onChange={(e) => updateForm("senderPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone *" />
            <input type="email" value={form.senderEmail} onChange={(e) => updateForm("senderEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1"><MapPin size={12} /> Receiver</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.receiverName} onChange={(e) => updateForm("receiverName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" />
            <input value={form.receiverPhone} onChange={(e) => updateForm("receiverPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone *" />
            <input type="email" value={form.receiverEmail} onChange={(e) => updateForm("receiverEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/60">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
              <ImageIcon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{imageFile ? imageFile.name : "Upload item image"}</p>
              <p className="text-xs text-gray-500">Optional — PNG or JPG</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleAddItem} disabled={submitting}>
            {submitting ? <><Loader2 className="animate-spin mr-1" size={14} /> Creating...</> : <><Plus size={14} className="mr-1" /> Add Item</>}
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">{items.length} item{items.length !== 1 ? "s" : ""} created</h3>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-xs text-gray-400 font-mono mt-0.5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.description}</p>
                  <p className="text-xs text-gray-500">{item.weight} kg — NGN {Number(item.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-primary font-mono">{item.ticketNumber}</p>
                  {item.itemNumber && <p className="text-xs text-primary/70 font-mono">{item.itemNumber}</p>}
                  {item.senderName && <p className="text-xs text-gray-400">From: {item.senderName}</p>}
                  {item.receiverName && <p className="text-xs text-gray-400">To: {item.receiverName}</p>}
                </div>
                <button onClick={() => handleRemoveItem(i)} className="text-gray-400 hover:text-red-500 mt-0.5"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="pt-2 text-right">
            <Button onClick={() => router.push("/company/tickets")}>
              Done — View All Tickets
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
