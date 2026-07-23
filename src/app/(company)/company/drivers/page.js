"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { Plus, Users, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api";
import { DRIVER_STATUSES, getLabel } from "@/lib/constants";

const columns = [
  {
    header: "Name",
    accessor: "fullName",
    sortable: true,
    render: (row) => (
      <Link href={`/company/drivers/${row.id}`} className="text-primary hover:underline font-medium">
        {row.fullName}
      </Link>
    ),
  },
  { header: "Phone", accessor: "phone", sortable: true },
  { header: "Email", accessor: "email", sortable: true },
  {
    header: "Status",
    accessor: "status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} />,
  },
];

const STEPS = ["Personal Info", "License & Emergency", "Account Setup"];

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  licenseNumber: "",
  licenseExpiresAt: "",
  nin: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyAddress: "",
  inviteToApp: false,
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await api.get("/drivers");
      setDrivers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDrivers();
  }, []);

  const total = drivers.length;
  const onTrip = drivers.filter((d) => d.status === "ON_TRIP").length;
  const active = drivers.filter((d) => d.status === "ACTIVE").length;
  const inactive = drivers.filter(
    (d) => d.status === "INACTIVE" || d.status === "SUSPENDED"
  ).length;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm ${errors[field] ? "border-red-400" : "border-gray-300"}`;

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.phone.trim()) e.phone = "Required";
    } else if (step === 2) {
      if (!form.licenseNumber.trim()) e.licenseNumber = "Required";
      if (!form.licenseExpiresAt.trim()) e.licenseExpiresAt = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        licenseNumber: form.licenseNumber,
        licenseExpiresAt: form.licenseExpiresAt ? new Date(form.licenseExpiresAt + "T23:59:59.000Z").toISOString() : "",
        joinedAt: new Date().toISOString(),
      };
      if (form.email) payload.email = form.email;
      if (form.dateOfBirth) payload.dateOfBirth = new Date(form.dateOfBirth + "T00:00:00.000Z").toISOString();
      if (form.nin) payload.nin = form.nin;
      if (form.emergencyName || form.emergencyPhone) {
        payload.emergencyContact = {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          address: form.emergencyAddress,
        };
      }
      if (form.inviteToApp) payload.inviteToApp = true;

      await api.post("/drivers", payload);
      closeWizard();
      await fetchDrivers();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const closeWizard = () => {
    setShowCreate(false);
    setStep(1);
    setForm(initialForm);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your drivers</p>
        </div>
        <Button onClick={() => { setStep(1); setForm(initialForm); setErrors({}); setShowCreate(true); }}>
          <Plus size={16} className="mr-1" /> Create Driver
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total Drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{onTrip}</p>
          <p className="text-xs text-gray-500">On Trip</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{inactive}</p>
          <p className="text-xs text-gray-500">Inactive / Suspended</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={drivers} loading={loading} searchable />
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeWizard(); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><UserPlus size={20} /> Create Driver</h3>
              <button onClick={closeWizard} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 overflow-x-auto pb-2">
              {STEPS.map((label, i) => (
                <span key={label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                  <span className={i + 1 === step ? "text-primary font-medium" : ""}>{label}</span>
                  {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
                </span>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                  <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass("fullName")} placeholder="e.g. Musa Aliyu" />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass("phone")} placeholder="e.g. 0803-111-2222" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. musa@example.com" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">License Number *</label>
                  <input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} className={inputClass("licenseNumber")} placeholder="e.g. NID-98765432-AB" />
                  {errors.licenseNumber && <p className="text-xs text-red-500 mt-1">{errors.licenseNumber}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">License Expiry *</label>
                  <input type="date" value={form.licenseExpiresAt} onChange={(e) => update("licenseExpiresAt", e.target.value)} className={inputClass("licenseExpiresAt")} />
                  {errors.licenseExpiresAt && <p className="text-xs text-red-500 mt-1">{errors.licenseExpiresAt}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">NIN</label>
                  <input value={form.nin} onChange={(e) => update("nin", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="National Identification Number" />
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">Emergency Contact</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contact Name</label>
                  <input value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Aisha Aliyu" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contact Phone</label>
                  <input value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 0803-555-7777" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contact Address</label>
                  <input value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 42 Abdullahi Street, Kano" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Create App Account</p>
                    <p className="text-xs text-gray-500">Create a driver account and send invitation to download the app</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update("inviteToApp", !form.inviteToApp)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${form.inviteToApp ? "bg-primary" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.inviteToApp ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
                <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-2 text-sm">
                  <p className="font-medium text-gray-900 mb-2">Review Driver Details</p>
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{form.fullName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{form.phone || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{form.email || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">License</span><span className="text-gray-900">{form.licenseNumber || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">License Expiry</span><span className="text-gray-900">{form.licenseExpiresAt || "—"}</span></div>
                  {form.emergencyName && <div className="flex justify-between"><span className="text-gray-500">Emergency Contact</span><span className="text-gray-900">{form.emergencyName}</span></div>}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && <Button variant="secondary" onClick={handleBack}>Previous</Button>}
              <Button variant="secondary" className="flex-1" onClick={closeWizard}>Cancel</Button>
              {step < 3 ? (
                <Button className="flex-1" onClick={handleNext}>Next</Button>
              ) : (
                <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating..." : "Create Driver"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
