"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plus, Trash2, Package, Weight, Ruler, Loader2, CheckCircle } from "lucide-react";

let itemCounter = 0;

const emptyItem = () => ({
  _key: `item-${++itemCounter}`,
  description: "",
  weight: "",
  amount: "",
  sizeW: "",
  sizeL: "",
  sizeH: "",
});

const STEPS = ["Ticket Details", "Add Items", "Assign Driver"];

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
  return Object.values(size).some((value) => value !== undefined) ? size : undefined;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 fields
  const [branches, setBranches] = useState([]);
  const [originBranchId, setOriginBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [requestedPickupAt, setRequestedPickupAt] = useState("");
  const [customerPriceAmount, setCustomerPriceAmount] = useState("");

  // Step 2
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(emptyItem());

  // Step 3
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Created ticket
  const [createdTicketId, setCreatedTicketId] = useState(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.get(`/tenants/${user.tenantId}`)
      .then((data) => setBranches(Array.isArray(data?.branches) ? data.branches : []))
      .catch(() => setBranches([]));
  }, [user?.tenantId]);

  useEffect(() => {
    if (step === 3) {
      Promise.all([api.get("/vehicles"), api.get("/drivers")])
        .then(([vData, dData]) => {
          setVehicles(Array.isArray(vData) ? vData : []);
          setDrivers(Array.isArray(dData) ? dData : []);
        })
        .catch(() => {})
        .finally(() => setLoadingOptions(false));
    }
  }, [step]);

  const updateItem = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (!currentItem.description.trim() || !optionalNumber(currentItem.weight) || !optionalNumber(currentItem.amount)) return;
    setItems((prev) => [
      ...prev,
      {
        ...currentItem,
        description: currentItem.description.trim(),
        weight: optionalNumber(currentItem.weight),
        amount: optionalNumber(currentItem.amount),
      },
    ]);
    setCurrentItem(emptyItem());
  };

  const removeItem = (key) => {
    setItems((prev) => (prev.filter((i) => i._key !== key)));
  };

  const canProceedStep1 = originBranchId && destinationBranchId && originAddress.trim() && destinationAddress.trim() && cargoDescription.trim();

  const handleCreateTicket = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        originBranchId,
        originAddress: originAddress.trim(),
        destinationBranchId,
        destinationAddress: destinationAddress.trim(),
        cargoDescription: cargoDescription.trim(),
        consignee: {
          name: user?.fullName || "Consignee",
          phone: user?.phone || "0000000000",
          address: originAddress.trim(),
          email: user?.email || undefined,
        },
        priority: "NORMAL",
      };
      if (requestedPickupAt) body.requestedPickupAt = new Date(requestedPickupAt).toISOString();
      if (customerPriceAmount) {
        body.customerPrice = {
          amount: optionalNumber(customerPriceAmount) || 0,
          currency: "NGN",
        };
      }
      const ticket = await api.post("/tickets", body);
      setCreatedTicketId(ticket.id);
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
        const itemPayload = {
          ticketId: createdTicketId,
          description: item.description,
          weight: item.weight,
          amount: item.amount,
          senderName: user?.fullName || "Consignee",
          senderEmail: user?.email || "consignee@placeholder.com",
          senderPhone: user?.phone || "0000000000",
          receiverName: "pending",
          receiverEmail: "pending@placeholder.com",
          receiverPhone: "0000000000",
        };
        const size = buildOptionalSize(item);
        if (size) itemPayload.size = size;
        await api.post("/items", itemPayload);
      }
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicleId || !selectedDriverId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/tickets/${createdTicketId}/assign`, {
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
      });
      router.push("/company/tickets");
    } catch (err) {
      setError(err.message || "Failed to assign driver");
    } finally {
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
        <p className="text-sm text-gray-500 mt-1">Fill in details, add items, then assign a driver</p>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 whitespace-nowrap">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
              {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
            </span>
            <span className={`text-sm ${i + 1 <= step ? "text-gray-900 font-medium" : "text-gray-500"}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Route & Ticket Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Origin Branch *</label>
              <select
                value={originBranchId}
                onChange={(e) => {
                  const branch = branches.find((b) => b.id === e.target.value);
                  setOriginBranchId(e.target.value);
                  setOriginAddress(branch?.address || branch?.name || "");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white"
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branchLabel(branch)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Destination Branch *</label>
              <select
                value={destinationBranchId}
                onChange={(e) => {
                  const branch = branches.find((b) => b.id === e.target.value);
                  setDestinationBranchId(e.target.value);
                  setDestinationAddress(branch?.address || branch?.name || "");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white"
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branchLabel(branch)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Cargo Description *</label>
              <input value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Electronics equipment" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Requested Pickup At</label>
              <input type="datetime-local" value={requestedPickupAt} onChange={(e) => setRequestedPickupAt(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Ticket Price (NGN)</label>
              <input type="number" min="0" value={customerPriceAmount} onChange={(e) => setCustomerPriceAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Origin Address</label>
              <input value={originAddress} readOnly className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Destination Address</label>
              <input value={destinationAddress} readOnly className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package size={16} /> Add Items</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item._key} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="text-xs text-gray-400 font-mono mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {item.weight} kg - NGN {Number(item.amount || 0).toLocaleString()} - Size {item.sizeW || "-"} x {item.sizeL || "-"} x {item.sizeH || "-"}
                      </p>
                      <p className="text-xs text-gray-400">{user?.fullName || "You"} (consignee)</p>
                    </div>
                    <button onClick={() => removeItem(item._key)} className="text-gray-400 hover:text-red-500 mt-0.5"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div>
                <label className="text-xs text-gray-500">Description *</label>
                <input value={currentItem.description} onChange={(e) => updateItem("description", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Electronics equipment" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1"><Weight size={10} /> Weight (kg) *</label>
                  <input type="number" step="0.1" min="0" value={currentItem.weight} onChange={(e) => updateItem("weight", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="0.0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1">Amount (NGN) *</label>
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
              <p className="text-xs text-gray-500">{user?.fullName || "You"} (consignee) — receiver details filled on arrival</p>
              <Button onClick={addItem} variant="secondary" size="sm"><Plus size={14} className="mr-1" /> Add Item</Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Assign Driver & Vehicle</h3>
            {loadingOptions ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Vehicle</label>
                  <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate || v.plateNumber || v.id} {v.makeModel ? `(${v.makeModel})` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Driver</label>
                  <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    <option value="">Select driver</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName} {d.phone ? `(${d.phone})` : ""}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Ticket Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Route</span><span className="font-medium">{originAddress || "—"} → {destinationAddress || "—"}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Cargo</span><span className="font-medium">{cargoDescription || "—"}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Pickup</span><span className="font-medium">{requestedPickupAt ? new Date(requestedPickupAt).toLocaleString() : "—"}</span></div>
              {customerPriceAmount && <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Ticket Price</span><span className="font-medium">NGN {parseFloat(customerPriceAmount).toLocaleString()}</span></div>}
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Item Total</span><span className="font-medium">NGN {items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString()}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Items</span><span className="font-medium">{items.length}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Driver</span><span className="font-medium">{drivers.find((d) => d.id === selectedDriverId)?.fullName || "Not assigned"}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-gray-500">Vehicle</span><span className="font-medium">{vehicles.find((v) => v.id === selectedVehicleId)?.plateNumber || vehicles.find((v) => v.id === selectedVehicleId)?.plate || "Not selected"}</span></div>
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
          <Button disabled={submitting} onClick={handleAddItemsAndContinue}>
            {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null} {items.length > 0 ? `Save ${items.length} Item${items.length > 1 ? "s" : ""} & Continue` : "Skip Items"}
          </Button>
        )}
        {step === 3 && (
          <Button disabled={!selectedVehicleId || !selectedDriverId || submitting} onClick={handleAssignDriver}>
            {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Assign & Finish
          </Button>
        )}
      </div>
    </div>
  );
}
