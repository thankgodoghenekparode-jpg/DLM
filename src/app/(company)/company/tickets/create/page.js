"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plus, Trash2, Package, Weight, Ruler, Loader2, CheckCircle, User, MapPin, ImageIcon } from "lucide-react";

let itemCounter = 0;

const emptyItem = () => ({
  _key: `item-${++itemCounter}`,
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
});

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

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [branches, setBranches] = useState([]);
  const [originBranchId, setOriginBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(emptyItem());
  const [imageFile, setImageFile] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const [createdTicketId, setCreatedTicketId] = useState(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.get(`/tenants/${user.tenantId}`)
      .then((data) => setBranches(Array.isArray(data?.branches) ? data.branches : []))
      .catch(() => setBranches([]));
  }, [user?.tenantId]);

  useEffect(() => {
    if (step === 3 && vehicles.length === 0) {
      Promise.all([api.get("/vehicles"), api.get("/drivers")])
        .then(([vData, dData]) => {
          setVehicles(Array.isArray(vData) ? vData : []);
          setDrivers(Array.isArray(dData) ? dData : []);
        })
        .catch(() => {});
    }
  }, [step, vehicles.length]);

  const updateItem = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (!currentItem.description.trim() || !optionalNumber(currentItem.weight) || !optionalNumber(currentItem.amount)) return;
    setItems((prev) => [...prev, { ...currentItem, imageFile }]);
    setCurrentItem(emptyItem());
    setImageFile(null);
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
  };

  const canProceedStep1 = originBranchId && destinationBranchId;

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
    const uploadData = await uploadRes.json();
    return uploadData.url;
  };

  const handleCreateTicket = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const originBranch = branches.find((b) => b.id === originBranchId);
      const destBranch = branches.find((b) => b.id === destinationBranchId);
      const body = {
        originBranchId,
        originAddress: originBranch?.address || originBranch?.name || "",
        destinationBranchId,
        destinationAddress: destBranch?.address || destBranch?.name || "",
      };
      const ticket = await api.post("/tickets", body);
      setCreatedTicketId(ticket.id);
      setCreatedTicketNumber(ticket.ticketNumber);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItemsAndContinue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      for (const item of items) {
        let pictureUrl = null;
        try { pictureUrl = await uploadImage(item.imageFile); } catch { pictureUrl = null; }

        const payload = {
          ticketId: createdTicketId,
          description: item.description.trim(),
          weight: Number(item.weight),
          amount: Number(item.amount),
          senderName: item.senderName.trim() || user?.fullName || "",
          senderPhone: item.senderPhone.trim() || user?.phone || "",
          senderEmail: item.senderEmail.trim() || user?.email || "",
          receiverName: item.receiverName.trim() || "",
          receiverPhone: item.receiverPhone.trim() || "",
          receiverEmail: item.receiverEmail.trim() || "",
        };
        const size = buildOptionalSize(item);
        if (size) payload.size = size;
        if (pictureUrl) payload.pictureUrl = pictureUrl;
        await api.post("/items", payload);
      }
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAndFinish = async () => {
    if (!selectedVehicleId || !selectedDriverId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/tickets/${createdTicketId}/submit`);
      await api.patch(`/tickets/${createdTicketId}/assign`, {
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
      });
      router.push("/company/tickets");
    } catch (err) {
      setError(err.message || "Failed to assign driver");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push("/company/tickets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <ArrowLeft size={14} /> Tickets
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["Details", "Items", "Assign"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 whitespace-nowrap">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
              {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
            </span>
            <span className={`text-sm ${i + 1 <= step ? "text-gray-900 font-medium" : "text-gray-500"}`}>{label}</span>
            {i < 2 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Route</h3>
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{items.length} item{items.length !== 1 ? "s" : ""}</h3>
                <span className="text-sm font-medium text-gray-700">NGN {items.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item._key} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="text-xs text-gray-400 font-mono mt-0.5">#{i + 1}</span>
                    {item.imageFile && (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src={URL.createObjectURL(item.imageFile)} alt="" className="w-full h-full object-cover" unoptimized />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.weight} kg — NGN {Number(item.amount || 0).toLocaleString()}</p>
                      {item.senderName && <p className="text-xs text-gray-400">From: {item.senderName}</p>}
                      {item.receiverName && <p className="text-xs text-gray-400">To: {item.receiverName}</p>}
                    </div>
                    <button onClick={() => removeItem(item._key)} className="text-gray-400 hover:text-red-500 mt-0.5"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-primary/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Plus size={16} /> Add Item</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">Description *</label>
                <input value={currentItem.description} onChange={(e) => updateItem("description", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Samsung TV" />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Weight size={10} /> Weight (kg) *</label>
                <input type="number" step="0.1" min="0" value={currentItem.weight} onChange={(e) => updateItem("weight", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0.0" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Amount (NGN) *</label>
                <input type="number" step="0.01" min="0" value={currentItem.amount} onChange={(e) => updateItem("amount", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> Width</label>
                <input type="number" step="0.01" min="0" value={currentItem.sizeW} onChange={(e) => updateItem("sizeW", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> Length</label>
                <input type="number" step="0.01" min="0" value={currentItem.sizeL} onChange={(e) => updateItem("sizeL", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Ruler size={10} /> Height</label>
                <input type="number" step="0.01" min="0" value={currentItem.sizeH} onChange={(e) => updateItem("sizeH", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1"><User size={12} /> Sender</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={currentItem.senderName} onChange={(e) => updateItem("senderName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" />
                <input value={currentItem.senderPhone} onChange={(e) => updateItem("senderPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone *" />
                <input type="email" value={currentItem.senderEmail} onChange={(e) => updateItem("senderEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1"><MapPin size={12} /> Receiver</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={currentItem.receiverName} onChange={(e) => updateItem("receiverName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" />
                <input value={currentItem.receiverPhone} onChange={(e) => updateItem("receiverPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone *" />
                <input type="email" value={currentItem.receiverEmail} onChange={(e) => updateItem("receiverEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/60">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <ImageIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{imageFile ? imageFile.name : "Upload item image"}</p>
                <p className="text-xs text-gray-500">PNG or JPG (optional)</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
            <Button onClick={addItem} variant="secondary" size="sm"><Plus size={14} className="mr-1" /> Add Item</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {createdTicketNumber && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Ticket Number</p>
              <p className="text-lg font-bold font-mono text-primary">{createdTicketNumber}</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Assign Driver & Vehicle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Vehicle *</label>
                <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber || v.plate || v.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Driver *</label>
                <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white">
                  <option value="">Select driver</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName || d.name} {d.phone ? `(${d.phone})` : ""}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Items</span><span className="font-medium">{items.length}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Total</span><span className="font-medium">NGN {items.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Weight</span><span className="font-medium">{items.reduce((s, i) => s + Number(i.weight || 0), 0).toLocaleString()} kg</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : router.push("/company/tickets")}>
          {step === 1 ? "Cancel" : "Previous"}
        </Button>
        {step === 1 && (
          <Button disabled={!canProceedStep1 || submitting} onClick={handleCreateTicket}>
            {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Create Ticket
          </Button>
        )}
        {step === 2 && (
          <Button disabled={submitting || items.length === 0} onClick={handleAddItemsAndContinue}>
            {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Continue with {items.length} item{items.length !== 1 ? "s" : ""}
          </Button>
        )}
        {step === 3 && (
          <Button disabled={!selectedVehicleId || !selectedDriverId || submitting} onClick={handleAssignAndFinish}>
            {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Assign & Finish
          </Button>
        )}
      </div>
    </div>
  );
}
