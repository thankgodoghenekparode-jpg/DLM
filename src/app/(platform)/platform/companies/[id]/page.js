"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import { Building2, CreditCard, Loader2, Edit3, ShieldCheck, X } from "lucide-react";
import { api } from "@/lib/api";
import { TENANT_STATUSES, KYC_STATUSES, KYC_DECISIONS, getLabel } from "@/lib/constants";

export default function CompanyDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ email: "", phone: "", address: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [showKyc, setShowKyc] = useState(false);
  const [kycDecision, setKycDecision] = useState("APPROVED");
  const [kycNote, setKycNote] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [showSubscription, setShowSubscription] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);

  const fetchTenant = () => {
    api.get("/platform/tenants")
      .then((data) => {
        const found = (Array.isArray(data) ? data : []).find((t) => t.id === id);
        if (!found) throw new Error("Company not found");
        setTenant(found);
        setLoading(false);
      })
      .catch((err) => { setError(err.message || "Failed to load company"); setLoading(false); });
  };

  useEffect(() => { fetchTenant(); }, [id]);

  const handleStatusChange = async (status, reason) => {
    setActionLoading(status);
    try {
      await api.patch(`/platform/tenants/${id}/status`, { status, reason });
      alert(`Company ${status.toLowerCase()} successfully.`);
      fetchTenant();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = () => {
    setEditForm({ email: tenant.email || "", phone: tenant.phone || "", address: tenant.address || "" });
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    setEditSubmitting(true);
    try {
      const body = {};
      if (editForm.email !== tenant.email) body.email = editForm.email;
      if (editForm.phone !== tenant.phone) body.phone = editForm.phone;
      if (editForm.address !== tenant.address) body.address = editForm.address;
      if (Object.keys(body).length > 0) {
        await api.patch(`/tenants/${id}`, body);
      }
      setShowEdit(false);
      fetchTenant();
    } catch (err) {
      alert(err.message || "Failed to update company");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleKycReview = async () => {
    setKycSubmitting(true);
    try {
      await api.patch(`/platform/tenants/${id}/kyc`, { decision: kycDecision, reviewNote: kycNote.trim() || undefined });
      setShowKyc(false);
      setKycNote("");
      fetchTenant();
    } catch (err) {
      alert(err.message || "Failed to review KYC");
    } finally {
      setKycSubmitting(false);
    }
  };

  const openSubscription = async () => {
    try {
      const data = await api.get("/platform/subscription-plans");
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    setSelectedPlanId("");
    setPeriodStart(now.toISOString().slice(0, 16));
    setPeriodEnd(end.toISOString().slice(0, 16));
    setShowSubscription(true);
  };

  const handleAssignSubscription = async () => {
    if (!selectedPlanId || !periodStart || !periodEnd) return;
    setSubSubmitting(true);
    try {
      await api.patch(`/platform/tenants/${id}/subscription`, {
        tenantId: id,
        planId: selectedPlanId,
        currentPeriodStart: new Date(periodStart).toISOString(),
        currentPeriodEnd: new Date(periodEnd).toISOString(),
      });
      setShowSubscription(false);
      fetchTenant();
    } catch (err) {
      alert(err.message || "Failed to assign subscription");
    } finally {
      setSubSubmitting(false);
    }
  };

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

  if (!tenant) return null;

  const isSuspended = tenant.status === "SUSPENDED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <button onClick={() => router.push("/platform/companies")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Companies</button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">{tenant.companyName || tenant.name}</h1>
          <StatusBadge status={tenant.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Building2 size={16} /> Company Info</h3>
              <button onClick={openEdit} className="text-gray-400 hover:text-primary"><Edit3 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Email</span><p className="font-medium">{tenant.email}</p></div>
              <div><span className="text-gray-500">Phone</span><p className="font-medium">{tenant.phone || "—"}</p></div>
              <div><span className="text-gray-500">Status</span><p className="font-medium">{getLabel(TENANT_STATUSES, tenant.status)}</p></div>
              <div><span className="text-gray-500">Joined</span><p className="font-medium">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "—"}</p></div>
              {tenant.address && <div className="col-span-2"><span className="text-gray-500">Address</span><p className="font-medium">{tenant.address}</p></div>}
              {tenant.industry && <div className="col-span-2"><span className="text-gray-500">Industry</span><p className="font-medium">{tenant.industry}</p></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><ShieldCheck size={16} /> KYC Status</h3>
              {(tenant.kycStatus === "PENDING_REVIEW") && (
                <Button size="sm" onClick={() => setShowKyc(true)}>Review</Button>
              )}
            </div>
            <p className="text-sm font-medium">{getLabel(KYC_STATUSES, tenant.kycStatus || "NOT_SUBMITTED")}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><CreditCard size={16} /> Subscription</h3>
              <Button size="sm" variant="secondary" onClick={openSubscription}>Assign Plan</Button>
            </div>
            <p className="text-sm font-medium">
              {tenant.plan?.name ? `${tenant.plan.name} — ${getLabel(TENANT_STATUSES, tenant.subscriptionStatus || tenant.status)}` : "No plan assigned"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="flex gap-2 flex-wrap">
              {isSuspended ? (
                <Button size="sm" onClick={() => handleStatusChange("ACTIVE", "Reactivated by platform")} disabled={actionLoading === "ACTIVE"}>
                  {actionLoading === "ACTIVE" ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Activate
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange("SUSPENDED", "Suspended by platform")} disabled={actionLoading === "SUSPENDED"}>
                  {actionLoading === "SUSPENDED" ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Suspend
                </Button>
              )}
              {tenant.status !== "DEACTIVATED" && (
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange("DEACTIVATED", "Deactivated by platform")} disabled={actionLoading === "DEACTIVATED"}>
                  {actionLoading === "DEACTIVATED" ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Deactivate
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Company Info</h3>
              <button onClick={() => setShowEdit(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Address</label><textarea value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleEditSave} disabled={editSubmitting}>{editSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save</Button>
            </div>
          </div>
        </div>
      )}

      {showKyc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowKyc(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review KYC</h3>
              <button onClick={() => setShowKyc(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Decision *</label>
                <select value={kycDecision} onChange={(e) => setKycDecision(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {KYC_DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Review Note</label><textarea value={kycNote} onChange={(e) => setKycNote(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional note" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowKyc(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleKycReview} disabled={kycSubmitting}>{kycSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Submit</Button>
            </div>
          </div>
        </div>
      )}

      {showSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSubscription(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assign Subscription Plan</h3>
              <button onClick={() => setShowSubscription(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Plan *</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a plan</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ₦{(p.price?.amount || 0).toLocaleString()}/{p.billingInterval?.toLowerCase()}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Period Start *</label><input type="datetime-local" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Period End *</label><input type="datetime-local" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowSubscription(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAssignSubscription} disabled={!selectedPlanId || !periodStart || !periodEnd || subSubmitting}>
                {subSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
