"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  CreditCard,
  ImageIcon,
  Loader2,
  MapPin,
  Package,
  Plus,
  Ticket,
  Truck,
  Trash2,
  UserRound,
} from "lucide-react";

const PAYMENT_OPTIONS = [
  { value: "PAY_NOW", label: "Pay Now" },
  { value: "PAY_AT_DELIVERY", label: "Pay at Delivery" },
];

const MAX_LOAD_ITEMS = 500;

const emptyForm = {
  originBranchId: "",
  destinationBranchId: "",
  vehicleId: "",
  driverId: "",
  dispatchDate: "",
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  receiverName: "",
  receiverPhone: "",
  receiverEmail: "",
  itemDescription: "",
  length: "",
  breadth: "",
  height: "",
  weight: "",
  paymentOption: "PAY_NOW",
  priceAmount: "",
};

function branchLabel(branch) {
  return [branch.name, branch.address].filter(Boolean).join(" - ") || branch.id;
}


export default function CreateParcelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadItems, setLoadItems] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [tenantData, vehicleData, driverData] = await Promise.all([
        tenantId ? api.get(`/tenants/${tenantId}`).catch(() => null) : Promise.resolve(null),
        api.get("/vehicles").catch(() => []),
        api.get("/drivers").catch(() => []),
      ]);

      setBranches(Array.isArray(tenantData?.branches) ? tenantData.branches : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
      setLoading(false);
    };

    loadOptions();
  }, [tenantId]);

  const originBranch = useMemo(
    () => branches.find((branch) => branch.id === form.originBranchId),
    [branches, form.originBranchId]
  );
  const destinationBranch = useMemo(
    () => branches.find((branch) => branch.id === form.destinationBranchId),
    [branches, form.destinationBranchId]
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === form.vehicleId),
    [vehicles, form.vehicleId]
  );
  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === form.driverId),
    [drivers, form.driverId]
  );

  const hasDispatchSetup = Boolean(
    form.originBranchId &&
      form.destinationBranchId &&
      form.vehicleId &&
      form.driverId &&
      form.dispatchDate &&
      form.senderName.trim() &&
      form.senderPhone.trim()
  );
  const hasItemDraft = Boolean(
    form.receiverName.trim() &&
      form.receiverPhone.trim() &&
      form.itemDescription.trim() &&
      Number(form.length) > 0 &&
      Number(form.breadth) > 0 &&
      Number(form.height) > 0 &&
      Number(form.weight) > 0
  );
  const draftItemCount = loadItems.length + (hasItemDraft ? 1 : 0);
  const canAddItem = hasDispatchSetup && hasItemDraft && loadItems.length < MAX_LOAD_ITEMS;
  const canCreate = hasDispatchSetup && draftItemCount > 0;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildItemDraft = (pictureFile = imageFile) => ({
    id: `load-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: form.itemDescription.trim(),
    weight: Number(form.weight),
    amount: Number(form.priceAmount || 0),
    size: {
      width: Number(form.breadth),
      length: Number(form.length),
      height: Number(form.height),
    },
    senderName: form.senderName.trim(),
    senderEmail: form.senderEmail.trim() || user?.email || "sender@example.com",
    senderPhone: form.senderPhone.trim(),
    receiverName: form.receiverName.trim(),
    receiverEmail: form.receiverEmail.trim() || "receiver@example.com",
    receiverPhone: form.receiverPhone.trim(),
    imageFile: pictureFile,
  });

  const resetItemDraft = () => {
    setForm((prev) => ({
      ...prev,
      receiverName: "",
      receiverPhone: "",
      receiverEmail: "",
      itemDescription: "",
      length: "",
      breadth: "",
      height: "",
      weight: "",
      priceAmount: "",
    }));
    setImageFile(null);
  };

  const handleAddItem = () => {
    if (!canAddItem) return;
    setLoadItems((prev) => [...prev, buildItemDraft()]);
    setCreatedTickets([]);
    resetItemDraft();
  };

  const handleRemoveItem = (id) => {
    setLoadItems((prev) => prev.filter((item) => item.id !== id));
    setCreatedTickets([]);
  };

  const uploadImage = async (file = imageFile) => {
    if (!file) return null;

    const data = new FormData();
    data.append("file", file);
    data.append("folder", "parcel-items");

    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api.getToken()}` },
      body: data,
    });

    if (!uploadRes.ok) {
      const uploadError = await uploadRes.json().catch(() => ({ message: "Image upload failed" }));
      throw new Error(uploadError.message || "Image upload failed");
    }

    const uploadData = await uploadRes.json();
    return uploadData.url;
  };

  const createTicketForItem = async (item, ticketPayload) => {
    const pictureUrl = await uploadImage(item.imageFile);
    const ticket = await api.post("/tickets", ticketPayload);

    const itemPayload = {
      ticketId: ticket.id,
      description: item.description,
      weight: item.weight,
      amount: item.amount,
      size: item.size,
      senderName: item.senderName,
      senderEmail: item.senderEmail,
      senderPhone: item.senderPhone,
      receiverName: item.receiverName,
      receiverEmail: item.receiverEmail,
      receiverPhone: item.receiverPhone,
    };
    if (pictureUrl) itemPayload.pictureUrl = pictureUrl;

    await api.post("/items", itemPayload);
    await api.patch(`/tickets/${ticket.id}/assign`, {
      vehicleId: form.vehicleId,
      driverId: form.driverId,
    });

    return {
      ...ticket,
      itemDescription: item.description,
      receiverName: item.receiverName,
      amount: item.amount,
    };
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    setError(null);
    setCreatedTickets([]);

    try {
      const itemsToCreate = hasItemDraft ? [...loadItems, buildItemDraft()] : loadItems;
      const ticketPayload = {
        originBranchId: form.originBranchId,
        destinationBranchId: form.destinationBranchId,
        originAddress: originBranch?.address || originBranch?.name || "",
        destinationAddress: destinationBranch?.address || destinationBranch?.name || "",
      };

      const tickets = [];
      for (const item of itemsToCreate) {
        tickets.push(await createTicketForItem(item, ticketPayload));
      }

      setCreatedTickets(tickets);
      setLoadItems([]);
      resetItemDraft();
    } catch (err) {
      setError(err.message || "Failed to create parcel load");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }


  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push("/company/dashboard")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Vehicle Load</h1>
            <p className="text-sm text-gray-500 mt-1">Choose a vehicle, add items, and generate one ticket for each item.</p>
          </div>
          <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            Each item gets its own ticket number
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {createdTickets.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle size={16} /> {createdTickets.length} ticket{createdTickets.length === 1 ? "" : "s"} generated for this vehicle load
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {createdTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => router.push(`/company/tickets/${ticket.id}`)}
                className="text-left bg-white border border-emerald-200 rounded-lg px-3 py-2 hover:border-emerald-400"
              >
                <p className="text-sm font-semibold text-emerald-950">{ticket.ticketNumber || ticket.id}</p>
                <p className="text-xs text-emerald-700 truncate">{ticket.itemDescription} - {ticket.receiverName}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} /> Branch Route
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Origin Branch *</label>
                <select value={form.originBranchId} onChange={(e) => update("originBranchId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select origin</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branchLabel(branch)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Destination Branch *</label>
                <select value={form.destinationBranchId} onChange={(e) => update("destinationBranchId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select destination</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branchLabel(branch)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Truck size={16} /> Dispatch Assignment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vehicle *</label>
                <select value={form.vehicleId} onChange={(e) => update("vehicleId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber || vehicle.plate || vehicle.id} {vehicle.makeModel ? `(${vehicle.makeModel})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Driver *</label>
                <select value={form.driverId} onChange={(e) => update("driverId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.fullName || driver.name || driver.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date of Dispatch *</label>
                <input type="datetime-local" value={form.dispatchDate} onChange={(e) => update("dispatchDate", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <UserRound size={16} /> Sender and Receiver
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Sender Details</p>
                <input value={form.senderName} onChange={(e) => update("senderName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Sender name *" />
                <input value={form.senderPhone} onChange={(e) => update("senderPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Sender phone *" />
                <input type="email" value={form.senderEmail} onChange={(e) => update("senderEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Sender email" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Receiver Details</p>
                <input value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver name *" />
                <input value={form.receiverPhone} onChange={(e) => update("receiverPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver phone *" />
                <input type="email" value={form.receiverEmail} onChange={(e) => update("receiverEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Receiver email" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package size={16} /> Item Details
            </h2>
            <div className="space-y-4">
              <textarea value={form.itemDescription} onChange={(e) => update("itemDescription", e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Item description *" />
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Size</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Length *</label>
                      <input type="number" min="0" step="0.01" value={form.length} onChange={(e) => update("length", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Breadth *</label>
                      <input type="number" min="0" step="0.01" value={form.breadth} onChange={(e) => update("breadth", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Height *</label>
                      <input type="number" min="0" step="0.01" value={form.height} onChange={(e) => update("height", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Weight</p>
                  <input type="number" min="0" step="0.01" value={form.weight} onChange={(e) => update("weight", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Weight in kg *" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/60">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <ImageIcon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{imageFile ? imageFile.name : "Upload item image"}</p>
                  <p className="text-xs text-gray-500">PNG or JPG image for the parcel item</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} /> Payment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Option *</label>
                <select value={form.paymentOption} onChange={(e) => update("paymentOption", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (NGN)</label>
                <input type="number" min="0" value={form.priceAmount} onChange={(e) => update("priceAmount", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
              </div>
            </div>
          </section>
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Ticket size={16} /> Tickets in This Vehicle
                </h2>
                <p className="text-xs text-gray-500 mt-1">Add each item here. Each item becomes its own ticket under the selected vehicle.</p>
              </div>
              <Button type="button" variant="secondary" disabled={!canAddItem || submitting} onClick={handleAddItem}>
                <Plus size={14} className="mr-1" /> Add Item
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-3 text-xs text-gray-600">
                <span>{selectedVehicle?.plateNumber || selectedVehicle?.plate || "Select a vehicle"}</span>
                <span>{draftItemCount}/{MAX_LOAD_ITEMS} tickets ready</span>
              </div>
              {loadItems.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500">
                  No item added yet. Fill the item form, then click Add Item.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {loadItems.map((item, index) => (
                    <div key={item.id} className="px-3 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Ticket {index + 1}: {item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Receiver: {item.receiverName} - {item.receiverPhone}</p>
                        <p className="text-xs text-gray-500">{item.weight} kg - {item.size.length} x {item.size.width} x {item.size.height} - NGN {item.amount.toLocaleString()}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Vehicle Load Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-500">Route</p>
                  <p className="font-medium text-gray-900 break-words">{originBranch?.name || "Origin"} to {destinationBranch?.name || "Destination"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Truck size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-500">Assignment</p>
                  <p className="font-medium text-gray-900 break-words">{selectedVehicle?.plateNumber || selectedVehicle?.plate || "Vehicle"} / {selectedDriver?.fullName || selectedDriver?.name || "Driver"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CalendarDays size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500">Dispatch</p>
                  <p className="font-medium text-gray-900">{form.dispatchDate ? new Date(form.dispatchDate).toLocaleString() : "Not set"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Package size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500">Tickets in this vehicle</p>
                  <p className="font-medium text-gray-900">{draftItemCount}/{MAX_LOAD_ITEMS} ticket{draftItemCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CreditCard size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium text-gray-900">{PAYMENT_OPTIONS.find((option) => option.value === form.paymentOption)?.label}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
              <Button className="w-full" disabled={!canCreate || submitting} onClick={handleCreate}>
                {submitting ? <Loader2 className="animate-spin mr-1" size={14} /> : null}
                {submitting ? "Creating tickets..." : `Submit ${draftItemCount || 1} Parcel${(draftItemCount || 1) === 1 ? "" : "s"}`}
              </Button>
              <Button variant="secondary" className="w-full" disabled={submitting} onClick={() => router.push("/company/dashboard")}>
                Cancel
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
