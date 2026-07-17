"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { Phone, Truck, Edit3, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { DRIVER_STATUSES, getLabel } from "@/lib/constants";

export default function DriverDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [form, setForm] = useState({
    phone: "", email: "", licenseNumber: "", licenseExpiresAt: "", dateOfBirth: "",
    currentVehicleId: "", status: "",
    ecName: "", ecPhone: "", ecAddress: "", ecEmail: "",
  });

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const data = await api.get(`/drivers/${id}`);
        setDriver(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  const openEdit = () => {
    setForm({
      phone: driver.phone || "",
      email: driver.email || "",
      licenseNumber: driver.licenseNumber || "",
      licenseExpiresAt: driver.licenseExpiresAt ? driver.licenseExpiresAt.slice(0, 16) : "",
      dateOfBirth: driver.dateOfBirth ? driver.dateOfBirth.slice(0, 10) : "",
      currentVehicleId: driver.currentVehicleId || "",
      status: driver.status || "",
      ecName: driver.emergencyContact?.name || "",
      ecPhone: driver.emergencyContact?.phone || "",
      ecAddress: driver.emergencyContact?.address || "",
      ecEmail: driver.emergencyContact?.email || "",
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    setEditSubmitting(true);
    try {
      const body = {};
      if (form.phone !== driver.phone) body.phone = form.phone;
      if (form.email !== driver.email) body.email = form.email;
      if (form.licenseNumber !== driver.licenseNumber) body.licenseNumber = form.licenseNumber;
      if (form.licenseExpiresAt !== (driver.licenseExpiresAt?.slice(0, 16) || "")) body.licenseExpiresAt = new Date(form.licenseExpiresAt).toISOString();
      if (form.dateOfBirth !== (driver.dateOfBirth?.slice(0, 10) || "")) body.dateOfBirth = new Date(form.dateOfBirth).toISOString();
      if (form.currentVehicleId !== (driver.currentVehicleId || "")) body.currentVehicleId = form.currentVehicleId || null;
      if (form.status !== driver.status) body.status = form.status;
      const ecChanged = form.ecName !== (driver.emergencyContact?.name || "")
        || form.ecPhone !== (driver.emergencyContact?.phone || "")
        || form.ecAddress !== (driver.emergencyContact?.address || "")
        || form.ecEmail !== (driver.emergencyContact?.email || "");
      if (ecChanged) {
        body.emergencyContact = {};
        if (form.ecName) body.emergencyContact.name = form.ecName;
        if (form.ecPhone) body.emergencyContact.phone = form.ecPhone;
        if (form.ecAddress) body.emergencyContact.address = form.ecAddress;
        if (form.ecEmail) body.emergencyContact.email = form.ecEmail;
      }
      if (Object.keys(body).length === 0) { setShowEdit(false); return; }
      const updated = await api.patch(`/drivers/${id}`, body);
      setDriver(updated);
      setShowEdit(false);
    } catch (err) {
      alert(err.message || "Failed to update driver");
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-gray-500">Loading driver...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/company/drivers")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Drivers</button>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  if (!driver) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push("/company/drivers")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Drivers</button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{driver.fullName}</h1>
          <StatusBadge status={driver.status} />
          <button onClick={openEdit} className="text-gray-400 hover:text-primary ml-auto"><Edit3 size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          {driver.photoUrl ? (
            <Image src={driver.photoUrl} alt={driver.fullName} width={64} height={64} className="w-16 h-16 rounded-full object-cover mx-auto" unoptimized />
          ) : (
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">{driver.fullName?.[0]}</span>
            </div>
          )}
          <h3 className="text-lg font-semibold mt-3">{driver.fullName}</h3>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" size="sm"><Phone size={14} className="mr-1" /> Call</Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Email</span><p className="font-medium">{driver.email || "—"}</p></div>
              <div><span className="text-gray-500">Phone</span><p className="font-medium">{driver.phone}</p></div>
              <div><span className="text-gray-500">Date of Birth</span><p className="font-medium">{driver.dateOfBirth || "—"}</p></div>
              <div><span className="text-gray-500">NIN</span><p className="font-medium">{driver.nin || "—"}</p></div>
              <div><span className="text-gray-500">Joined</span><p className="font-medium">{driver.joinedAt ? new Date(driver.joinedAt).toLocaleDateString() : "—"}</p></div>
              <div><span className="text-gray-500">Source</span><p className="font-medium">{driver.sourceProvenance || "—"}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">License</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">License Number</span><p className="font-medium">{driver.licenseNumber}</p></div>
              <div><span className="text-gray-500">License Expires</span><p className="font-medium">{driver.licenseExpiresAt || "—"}</p></div>
            </div>
          </div>

          {driver.emergencyContact && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name</span><p className="font-medium">{driver.emergencyContact.name || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{driver.emergencyContact.phone || "—"}</p></div>
                <div><span className="text-gray-500">Address</span><p className="font-medium">{driver.emergencyContact.address || "—"}</p></div>
                {driver.emergencyContact.email && <div><span className="text-gray-500">Email</span><p className="font-medium">{driver.emergencyContact.email}</p></div>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Status</span><p className="font-medium">{getLabel(DRIVER_STATUSES, driver.status)}</p></div>
              <div><span className="text-gray-500">Current Vehicle</span><p className="font-medium flex items-center gap-1"><Truck size={14} /> {driver.currentVehicleId || "—"}</p></div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Driver</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Personal Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Email</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
              </div>
              <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">License</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">License Number</label><input value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">License Expires</label><input type="datetime-local" value={form.licenseExpiresAt} onChange={(e) => setForm((p) => ({ ...p, licenseExpiresAt: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
              </div>
              <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Name</label><input value={form.ecName} onChange={(e) => setForm((p) => ({ ...p, ecName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input value={form.ecPhone} onChange={(e) => setForm((p) => ({ ...p, ecPhone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Address</label><input value={form.ecAddress} onChange={(e) => setForm((p) => ({ ...p, ecAddress: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Email</label><input type="email" value={form.ecEmail} onChange={(e) => setForm((p) => ({ ...p, ecEmail: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
              </div>
              <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assignment</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {DRIVER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Current Vehicle ID</label><input value={form.currentVehicleId} onChange={(e) => setForm((p) => ({ ...p, currentVehicleId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={editSubmitting}>
                {editSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
