"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { Truck, Activity, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { VEHICLE_TYPES, VEHICLE_STATUSES, VEHICLE_OWNERSHIP, getLabel } from "@/lib/constants";

export default function FleetDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(setVehicle).finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    setForm({
      makeModel: vehicle.makeModel || "",
      capacityTonnage: vehicle.capacityTonnage ?? "",
      status: vehicle.status || "",
      currentDriverId: vehicle.currentDriverId || "",
    });
    setErrors({});
    setShowEdit(true);
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setErrors({});
    setSaving(true);
    try {
      const payload = {};
      if (form.makeModel !== (vehicle.makeModel || "")) payload.makeModel = form.makeModel;
      if (form.capacityTonnage !== (vehicle.capacityTonnage ?? "")) payload.capacityTonnage = form.capacityTonnage !== "" ? Number(form.capacityTonnage) : null;
      if (form.status !== vehicle.status) payload.status = form.status;
      if (form.currentDriverId !== (vehicle.currentDriverId || "")) payload.currentDriverId = form.currentDriverId || undefined;

      const updated = await api.patch(`/vehicles/${id}`, payload);
      setVehicle(updated);
      setShowEdit(false);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-8 text-center text-gray-500">Loading...</div>;
  if (!vehicle) return <div className="max-w-4xl mx-auto p-8 text-center text-gray-500">Vehicle not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push("/company/fleet")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Fleet</button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{vehicle.plateNumber}</h1>
          <StatusBadge status={vehicle.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{vehicle.makeModel} • {getLabel(VEHICLE_TYPES, vehicle.type)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Truck size={16} /> Vehicle Details</h3>
            <button onClick={openEdit} className="text-gray-400 hover:text-primary p-1" title="Edit vehicle"><Pencil size={16} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Plate Number</span><p className="font-medium">{vehicle.plateNumber}</p></div>
            <div><span className="text-gray-500">Make & Model</span><p className="font-medium">{vehicle.makeModel}</p></div>
            <div><span className="text-gray-500">Vehicle Type</span><p className="font-medium">{getLabel(VEHICLE_TYPES, vehicle.type)}</p></div>
            <div><span className="text-gray-500">Year</span><p className="font-medium">{vehicle.year || "—"}</p></div>
            <div><span className="text-gray-500">Capacity</span><p className="font-medium">{vehicle.capacityTonnage ? `${vehicle.capacityTonnage} tons` : "—"}</p></div>
            <div><span className="text-gray-500">Ownership</span><p className="font-medium">{getLabel(VEHICLE_OWNERSHIP, vehicle.ownership)
}</p></div>
            <div><span className="text-gray-500">Status</span><p className="font-medium"><StatusBadge status={vehicle.status} /></p></div>
            <div><span className="text-gray-500">Driver ID</span><p className="font-medium">{vehicle.currentDriverId || "—"}</p></div>
            <div><span className="text-gray-500">Date Added</span><p className="font-medium">{new Date(vehicle.createdAt).toLocaleDateString()}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Activity size={16} /> Recent Trips</h3>
        <div className="text-sm text-gray-500">No recent trips recorded yet.</div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => router.push("/company/fleet")}>Back to Fleet</Button>
        <Button variant="secondary" onClick={openEdit}><Pencil size={14} className="mr-1" /> Edit Vehicle</Button>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Vehicle">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
          <div><label className="text-xs text-gray-500 mb-1 block">Make/Model</label><input value={form.makeModel} onChange={(e) => updateForm("makeModel", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Status</label><select value={form.status} onChange={(e) => updateForm("status", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{VEHICLE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Capacity (tons)</label><input type="number" value={form.capacityTonnage} onChange={(e) => updateForm("capacityTonnage", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 24" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Current Driver ID</label><input value={form.currentDriverId} onChange={(e) => updateForm("currentDriverId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Driver ID or leave empty" /></div>
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs text-gray-400 font-medium">Read-only fields</p>
            <div><label className="text-xs text-gray-400 mb-1 block">Plate Number</label><input value={vehicle.plateNumber} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" readOnly /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Type</label><input value={getLabel(VEHICLE_TYPES, vehicle.type)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" readOnly /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Year</label><input value={vehicle.year || ""} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" readOnly /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Ownership</label><input value={getLabel(VEHICLE_OWNERSHIP, vehicle.ownership)
} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" readOnly /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Date Added</label><input value={new Date(vehicle.createdAt).toLocaleDateString()} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" readOnly /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
