"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { Plus, Truck, X } from "lucide-react";
import { api } from "@/lib/api";
import { VEHICLE_TYPES, VEHICLE_OWNERSHIP, getLabel } from "@/lib/constants";

const STEPS = ["Vehicle Info", "Specs & Review"];

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    plateNumber: "",
    makeModel: "",
    type: "",
    ownership: "",
    capacityTonnage: "",
    year: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/vehicles").then((data) => setVehicles(data)).finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => ({
    total: vehicles.length,
    inTransit: vehicles.filter((v) => v.status === "ON_TRANSIT").length,
    active: vehicles.filter((v) => v.status === "ACTIVE").length,
  }), [vehicles]);

  const columns = [
    { header: "Plate", accessor: "plateNumber", sortable: true, render: (row) => <Link href={`/company/fleet/${row.id}`} className="text-primary hover:underline font-medium">{row.plateNumber}</Link> },
    { header: "Vehicle", accessor: "makeModel", sortable: true },
    { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { header: "Type", accessor: "type", sortable: true, render: (row) => getLabel(VEHICLE_TYPES, row.type) },
    { header: "Date Added", accessor: "createdAt", sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ];

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const inputClass = (field) => `w-full border rounded-lg px-3 py-2 text-sm ${errors[field] ? "border-red-400" : "border-gray-300"}`;

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.plateNumber.trim()) e.plateNumber = "Required";
      if (!form.makeModel.trim()) e.makeModel = "Required";
      if (!form.type) e.type = "Required";
      if (!form.ownership) e.ownership = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setStep((s) => s + 1); };
  const handleBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleCreate = async () => {
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        plateNumber: form.plateNumber.trim(),
        makeModel: form.makeModel.trim(),
        type: form.type,
        ownership: form.ownership,
      };
      if (form.capacityTonnage) payload.capacityTonnage = Number(form.capacityTonnage);
      if (form.year) payload.year = Number(form.year);

      const created = await api.post("/vehicles", payload);
      setVehicles((prev) => [...prev, created]);
      closeWizard();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closeWizard = () => {
    setShowAdd(false);
    setStep(1);
    setForm({ plateNumber: "", makeModel: "", type: "", ownership: "", capacityTonnage: "", year: "" });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your vehicles</p>
        </div>
        <Button onClick={() => { setStep(1); setForm({ plateNumber: "", makeModel: "", type: "", ownership: "", capacityTonnage: "", year: "" }); setErrors({}); setShowAdd(true); }}><Plus size={16} className="mr-1" /> Add Vehicle</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Truck size={20} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{kpis.total}</p><p className="text-xs text-gray-500">Total Vehicles</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Truck size={20} className="text-primary" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{kpis.inTransit}</p><p className="text-xs text-gray-500">In Transit</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Truck size={20} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{kpis.active}</p><p className="text-xs text-gray-500">Active</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={vehicles} searchable />
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeWizard(); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Truck size={20} /> Add Vehicle</h3>
              <button onClick={closeWizard} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
              {STEPS.map((label, i) => (
                <span key={label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                  <span className={i + 1 === step ? "text-primary font-medium" : ""}>{label}</span>
                  {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
                </span>
              ))}
            </div>

            {errors.submit && <p className="text-sm text-red-500 mb-3">{errors.submit}</p>}

            {step === 1 && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Plate Number *</label><input value={form.plateNumber} onChange={(e) => update("plateNumber", e.target.value)} className={inputClass("plateNumber")} placeholder="e.g. KJA-224-XY" />{errors.plateNumber && <p className="text-xs text-red-500 mt-1">{errors.plateNumber}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Make & Model *</label><input value={form.makeModel} onChange={(e) => update("makeModel", e.target.value)} className={inputClass("makeModel")} placeholder="e.g. Mercedes Actros" />{errors.makeModel && <p className="text-xs text-red-500 mt-1">{errors.makeModel}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Vehicle Type *</label><select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass("type")}><option value="">Select type</option>{VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>{errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Ownership *</label><select value={form.ownership} onChange={(e) => update("ownership", e.target.value)} className={inputClass("ownership")}><option value="">Select ownership</option>{VEHICLE_OWNERSHIP.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{errors.ownership && <p className="text-xs text-red-500 mt-1">{errors.ownership}</p>}</div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Capacity (tons)</label><input type="number" value={form.capacityTonnage} onChange={(e) => update("capacityTonnage", e.target.value)} className={inputClass("capacityTonnage")} placeholder="e.g. 24" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Year of Manufacture</label><input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} className={inputClass("year")} placeholder="e.g. 2023" /></div>
                <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-2 text-sm">
                  <p className="font-medium text-gray-900 mb-2">Review Vehicle Details</p>
                  <div className="flex justify-between"><span className="text-gray-500">Plate Number</span><span className="text-gray-900">{form.plateNumber || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Make & Model</span><span className="text-gray-900">{form.makeModel || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-900">{getLabel(VEHICLE_TYPES, form.type) || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ownership</span><span className="text-gray-900">{getLabel(VEHICLE_OWNERSHIP, form.ownership) || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="text-gray-900">{form.capacityTonnage ? `${form.capacityTonnage} tons` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="text-gray-900">{form.year || "—"}</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && <Button variant="secondary" onClick={handleBack}>Previous</Button>}
              <Button variant="secondary" className="flex-1" onClick={closeWizard}>Cancel</Button>
              {step < 2 ? (
                <Button className="flex-1" onClick={handleNext}>Next</Button>
              ) : (
                <Button className="flex-1" onClick={handleCreate} disabled={submitting}>{submitting ? "Adding..." : "Add Vehicle"}</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
