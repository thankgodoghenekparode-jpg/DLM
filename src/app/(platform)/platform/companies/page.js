"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import AddressMapPicker from "@/components/shared/AddressMapPicker";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const STEPS = ["Company Info", "Admin Account", "Plan", "Review"];

export default function CompaniesPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyName: "", companyEmail: "", companyPhone: "", companyAddress: "",
    cacRegistrationNumber: "",
    adminFullName: "", adminEmail: "", adminPhone: "", adminPassword: "",
    branchName: "Main Branch", branchAddress: "",
    branchLatitude: "", branchLongitude: "",
    planName: "",
  });
  const [errors, setErrors] = useState({});

  const fetchTenants = () => {
    api.get("/platform/tenants")
      .then((data) => { setTenants(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load companies"); setLoading(false); });
  };

  useEffect(() => { fetchTenants(); }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.companyName.trim()) e.companyName = "Required";
      if (!form.companyEmail.trim()) e.companyEmail = "Required";
      if (!form.companyPhone.trim()) e.companyPhone = "Required";
      if (!form.cacRegistrationNumber.trim()) e.cacRegistrationNumber = "Required";
    } else if (step === 2) {
      if (!form.adminFullName.trim()) e.adminFullName = "Required";
      if (!form.adminEmail.trim()) e.adminEmail = "Required";
      if (!form.adminPhone.trim()) e.adminPhone = "Required";
      if (!form.adminPassword) e.adminPassword = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };
  const handleBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post("/platform/tenants", {
        companyName: form.companyName,
        email: form.companyEmail,
        phone: form.companyPhone,
        address: form.companyAddress,
        cacRegistrationNumber: form.cacRegistrationNumber,
        cacCertificate: { fileName: "pending.pdf", fileUrl: "https://pending-upload.dlm.com/certificate.pdf" },
        password: form.adminPassword,
        primaryContact: {
          fullName: form.adminFullName,
          roleTitle: "Admin",
          phone: form.adminPhone,
          email: form.adminEmail,
        },
        primaryBranch: {
          name: form.branchName || "Main Branch",
          address: form.branchAddress || form.companyAddress,
          geolocation: {
            latitude: parseFloat(form.branchLatitude) || 6.5244,
            longitude: parseFloat(form.branchLongitude) || 3.3792,
          },
        },
      });
      alert(`Company "${form.companyName}" created successfully.`);
      setShowAdd(false);
      setStep(1);
      setForm({ companyName: "", companyEmail: "", companyPhone: "", companyAddress: "", cacRegistrationNumber: "", adminFullName: "", adminEmail: "", adminPhone: "", adminPassword: "", branchName: "Main Branch", branchAddress: "", branchLatitude: "", branchLongitude: "", planName: "" });
      setErrors({});
      fetchTenants();
    } catch (err) {
      alert(err.message || "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  };

  const openWizard = () => {
    setStep(1);
    setForm({ companyName: "", companyEmail: "", companyPhone: "", companyAddress: "", cacRegistrationNumber: "", adminFullName: "", adminEmail: "", adminPhone: "", adminPassword: "", branchName: "Main Branch", branchAddress: "", branchLatitude: "", branchLongitude: "", planName: "" });
    setErrors({});
    setShowAdd(true);
  };

  const inputClass = (field) => `w-full border rounded-lg px-3 py-2 text-sm ${errors[field] ? "border-red-400" : "border-gray-300"}`;

  const totalTenants = tenants.length;
  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const pendingCount = tenants.filter((t) => t.status === "PENDING_VERIFICATION").length;
  const suspendedCount = tenants.filter((t) => t.status === "SUSPENDED" || t.status === "DEACTIVATED").length;

  const columns = [
    { header: "Company", accessor: "companyName", sortable: true, render: (row) => <Link href={`/platform/companies/${row.id}`} className="text-primary hover:underline font-medium">{row.companyName || row.name}</Link> },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { header: "Phone", accessor: "phone", sortable: true },
  ];

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
        <button className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered companies</p>
        </div>
        <Button onClick={openWizard}><Plus size={16} className="mr-1" /> Add Company</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-2xl font-bold text-gray-900">{totalTenants}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-2xl font-bold text-green-600">{activeCount}</p><p className="text-xs text-gray-500">Active</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p><p className="text-xs text-gray-500">Pending</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-2xl font-bold text-red-600">{suspendedCount}</p><p className="text-xs text-gray-500">Suspended</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={tenants} searchable />
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Add New Company</h3>
            <p className="text-sm text-gray-500 mb-4">Company will be created as ACTIVE immediately</p>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 overflow-x-auto pb-2">
              {STEPS.map((label, i) => (
                <span key={label} className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                  <span className={i + 1 === step ? "text-primary font-medium" : ""}>{label}</span>
                  {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
                </span>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Company Name *</label><input value={form.companyName} onChange={(e) => updateForm("companyName", e.target.value)} className={inputClass("companyName")} placeholder="e.g. Babatunde Logistics" />{errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Email *</label><input type="email" value={form.companyEmail} onChange={(e) => updateForm("companyEmail", e.target.value)} className={inputClass("companyEmail")} placeholder="e.g. info@company.com" />{errors.companyEmail && <p className="text-xs text-red-500 mt-1">{errors.companyEmail}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Phone *</label><input value={form.companyPhone} onChange={(e) => updateForm("companyPhone", e.target.value)} className={inputClass("companyPhone")} placeholder="e.g. 0803-111-2222" />{errors.companyPhone && <p className="text-xs text-red-500 mt-1">{errors.companyPhone}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">CAC Registration Number *</label><input value={form.cacRegistrationNumber} onChange={(e) => updateForm("cacRegistrationNumber", e.target.value)} className={inputClass("cacRegistrationNumber")} placeholder="e.g. RC-1234567" />{errors.cacRegistrationNumber && <p className="text-xs text-red-500 mt-1">{errors.cacRegistrationNumber}</p>}</div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Branch Address & Location</label>
                  <AddressMapPicker
                    address={form.companyAddress}
                    latitude={form.branchLatitude ? Number(form.branchLatitude) : undefined}
                    longitude={form.branchLongitude ? Number(form.branchLongitude) : undefined}
                    onChange={({ address, latitude, longitude }) => setForm((prev) => ({ ...prev, companyAddress: address, branchAddress: address, branchLatitude: String(latitude), branchLongitude: String(longitude) }))}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Admin Full Name *</label><input value={form.adminFullName} onChange={(e) => updateForm("adminFullName", e.target.value)} className={inputClass("adminFullName")} placeholder="e.g. John Doe" />{errors.adminFullName && <p className="text-xs text-red-500 mt-1">{errors.adminFullName}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Admin Email *</label><input type="email" value={form.adminEmail} onChange={(e) => updateForm("adminEmail", e.target.value)} className={inputClass("adminEmail")} placeholder="e.g. admin@company.com" />{errors.adminEmail && <p className="text-xs text-red-500 mt-1">{errors.adminEmail}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Admin Phone *</label><input value={form.adminPhone} onChange={(e) => updateForm("adminPhone", e.target.value)} className={inputClass("adminPhone")} placeholder="e.g. 0803-111-2222" />{errors.adminPhone && <p className="text-xs text-red-500 mt-1">{errors.adminPhone}</p>}</div>
                <div><label className="text-xs text-gray-500 mb-1 block">Password *</label><input type="password" value={form.adminPassword} onChange={(e) => updateForm("adminPassword", e.target.value)} className={inputClass("adminPassword")} placeholder="Create a password" />{errors.adminPassword && <p className="text-xs text-red-500 mt-1">{errors.adminPassword}</p>}</div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-gray-500">Optional — assign a subscription plan later.</p>
                <div><label className="text-xs text-gray-500 mb-1 block">Plan Name</label><input value={form.planName} onChange={(e) => updateForm("planName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Pro" /></div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-500">Company:</span> <span className="font-medium">{form.companyName}</span></p>
                  <p><span className="text-gray-500">Email:</span> <span className="font-medium">{form.companyEmail}</span></p>
                  <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{form.companyPhone}</span></p>
                  {form.companyAddress && <p><span className="text-gray-500">Address:</span> <span className="font-medium">{form.companyAddress}</span></p>}
                  {form.cacRegistrationNumber && <p><span className="text-gray-500">CAC #:</span> <span className="font-medium">{form.cacRegistrationNumber}</span></p>}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-500">Admin:</span> <span className="font-medium">{form.adminFullName}</span></p>
                  <p><span className="text-gray-500">Admin Email:</span> <span className="font-medium">{form.adminEmail}</span></p>
                </div>
                <p className="text-xs text-green-600 bg-green-50 rounded-lg p-3">This company will be created as <strong>ACTIVE</strong> immediately.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && <Button variant="secondary" onClick={handleBack}>Previous</Button>}
              <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              {step < 4 ? (
                <Button className="flex-1" onClick={handleNext}>Next</Button>
              ) : (
                <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                  Create Company
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
