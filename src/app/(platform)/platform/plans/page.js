"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import Button from "@/components/shared/Button";
import { Plus, CreditCard, Loader2, Pencil, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { BILLING_INTERVALS, getLabel } from "@/lib/constants";

const emptyForm = {
  name: "", priceAmount: "", priceCurrency: "NGN", billingInterval: "MONTHLY", gracePeriodDays: "5",
  maxVehicles: "", maxDrivers: "", maxTicketsPerMonth: "",
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchPlans = () => {
    api.get("/platform/subscription-plans")
      .then((data) => { setPlans(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load plans"); setLoading(false); });
  };

  useEffect(() => { fetchPlans(); }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!form.name.trim()) { alert("Plan name is required"); return; }
    if (!form.priceAmount || Number(form.priceAmount) <= 0) { alert("Valid price is required"); return; }
    setSubmitting(true);
    try {
      const body = buildBody();
      await api.post("/platform/subscription-plans", body);
      alert(`Plan "${form.name}" created successfully.`);
      setShowCreate(false);
      setForm(emptyForm);
      fetchPlans();
    } catch (err) {
      alert(err.message || "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (plan) => {
    setForm({
      name: plan.name || "",
      priceAmount: String(plan.price?.amount || ""),
      priceCurrency: plan.price?.currency || "NGN",
      billingInterval: plan.billingInterval || "MONTHLY",
      gracePeriodDays: String(plan.gracePeriodDays ?? "5"),
      maxVehicles: plan.maxVehicles != null ? String(plan.maxVehicles) : "",
      maxDrivers: plan.maxDrivers != null ? String(plan.maxDrivers) : "",
      maxTicketsPerMonth: plan.maxTicketsPerMonth != null ? String(plan.maxTicketsPerMonth) : "",
    });
    setShowEdit(plan.id);
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setSubmitting(true);
    try {
      const body = buildBody();
      await api.patch(`/platform/subscription-plans/${showEdit}`, body);
      alert("Plan updated successfully.");
      setShowEdit(null);
      setForm(emptyForm);
      fetchPlans();
    } catch (err) {
      alert(err.message || "Failed to update plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/platform/subscription-plans/${showDelete.id}`);
      alert(`Plan "${showDelete.name}" deactivated.`);
      setShowDelete(null);
      fetchPlans();
    } catch (err) {
      alert(err.message || "Failed to deactivate plan");
    } finally {
      setSubmitting(false);
    }
  };

  const buildBody = () => {
    const body = {
      name: form.name,
      price: { amount: Number(form.priceAmount), currency: form.priceCurrency },
      billingInterval: form.billingInterval,
      gracePeriodDays: Number(form.gracePeriodDays) || 0,
    };
    if (form.maxVehicles && Number(form.maxVehicles) > 0) body.maxVehicles = Number(form.maxVehicles);
    if (form.maxDrivers && Number(form.maxDrivers) > 0) body.maxDrivers = Number(form.maxDrivers);
    if (form.maxTicketsPerMonth && Number(form.maxTicketsPerMonth) > 0) body.maxTicketsPerMonth = Number(form.maxTicketsPerMonth);
    return body;
  };

  const formatPrice = (plan) => {
    const amt = plan.price?.amount || 0;
    const cur = plan.price?.currency || "NGN";
    const interval = getLabel(BILLING_INTERVALS, plan.billingInterval);
    if (cur === "NGN") return `₦${amt.toLocaleString()}/${interval.toLowerCase()}`;
    return `${cur} ${amt.toLocaleString()}/${interval.toLowerCase()}`;
  };

  const modalContent = (isEdit) => (
    <div className="space-y-3">
      <div><label className="text-xs text-gray-500 mb-1 block">Plan Name *</label>
        <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. Pro" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500 mb-1 block">Price (₦) *</label>
          <input type="number" min="0" value={form.priceAmount} onChange={(e) => updateForm("priceAmount", e.target.value)} placeholder="45000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Currency</label>
          <select value={form.priceCurrency} onChange={(e) => updateForm("priceCurrency", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="NGN">NGN (₦)</option>
          </select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500 mb-1 block">Billing Interval</label>
          <select value={form.billingInterval} onChange={(e) => updateForm("billingInterval", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {BILLING_INTERVALS.map((bi) => <option key={bi.value} value={bi.value}>{bi.label}</option>)}
          </select></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Grace Period (days)</label>
          <input type="number" min="0" value={form.gracePeriodDays} onChange={(e) => updateForm("gracePeriodDays", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500 mb-1 block">Max Vehicles</label>
          <input type="number" min="0" value={form.maxVehicles} onChange={(e) => updateForm("maxVehicles", e.target.value)} placeholder="∞" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Max Drivers</label>
          <input type="number" min="0" value={form.maxDrivers} onChange={(e) => updateForm("maxDrivers", e.target.value)} placeholder="∞" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Max Tickets/Mo</label>
          <input type="number" min="0" value={form.maxTicketsPerMonth} onChange={(e) => updateForm("maxTicketsPerMonth", e.target.value)} placeholder="∞" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" className="flex-1" onClick={() => { setShowEdit(null); setShowCreate(false); setForm(emptyForm); }}>Cancel</Button>
        <Button className="flex-1" onClick={isEdit ? handleEdit : handleCreate} disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null} {isEdit ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );

  const columns = [
    { header: "Plan", accessor: "name", sortable: true },
    { header: "Price", accessor: "price", sortable: true, render: (row) => formatPrice(row) },
    { header: "Billing", accessor: "billingInterval", sortable: true, render: (row) => getLabel(BILLING_INTERVALS, row.billingInterval) },
    { header: "Grace Period", accessor: "gracePeriodDays", sortable: true, render: (row) => `${row.gracePeriodDays || 0} days` },
    { header: "Max Vehicles", accessor: "maxVehicles", sortable: true, render: (row) => row.maxVehicles ?? "Unlimited" },
    { header: "Max Drivers", accessor: "maxDrivers", sortable: true, render: (row) => row.maxDrivers ?? "Unlimited" },
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
          <h1 className="text-xl font-bold text-gray-900">Pricing Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription tiers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-1" /> Create Plan</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5 relative">
            <div className="absolute top-3 right-3 flex gap-1">
              <button onClick={() => openEdit(plan)} className="text-gray-400 hover:text-primary p-1"><Pencil size={14} /></button>
              <button onClick={() => setShowDelete(plan)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
            </div>
            <CreditCard size={20} className="text-primary mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-primary mt-2">{formatPrice(plan)}</p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              {plan.maxVehicles != null && <p>{plan.maxVehicles} vehicles max</p>}
              {plan.maxDrivers != null && <p>{plan.maxDrivers} drivers max</p>}
              {plan.maxTicketsPerMonth != null && <p>{plan.maxTicketsPerMonth} tickets/month</p>}
              <p>{plan.gracePeriodDays || 0} day grace period</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={plans} />
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreate(false); setForm(emptyForm); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Plan</h3>
              <button onClick={() => { setShowCreate(false); setForm(emptyForm); }}><X size={18} className="text-gray-400" /></button>
            </div>
            {modalContent(false)}
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowEdit(null); setForm(emptyForm); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Plan</h3>
              <button onClick={() => { setShowEdit(null); setForm(emptyForm); }}><X size={18} className="text-gray-400" /></button>
            </div>
            {modalContent(true)}
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDelete(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Plan?</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to deactivate <strong>{showDelete.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDelete(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
