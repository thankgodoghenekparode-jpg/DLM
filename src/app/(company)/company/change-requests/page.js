"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/shared/Button";
import AddressMapPicker from "@/components/shared/AddressMapPicker";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const CHANGE_FIELDS = [
  { value: "COMPANY_NAME", label: "Company Name" },
  { value: "BRANCH_GEOLOCATION", label: "Branch Location" },
];

const initialForm = {
  field: "",
  branchId: "",
  requestedValue: "",
  address: "",
  latitude: "",
  longitude: "",
  reason: "",
};

export default function ChangeRequestsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [form, setForm] = useState(initialForm);
  const [branches, setBranches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!tenantId) return;
    api.get(`/tenants/${tenantId}`)
      .then((data) => setBranches(data.branches || []))
      .catch(() => {});
  }, [tenantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.field || !form.reason.trim()) return;
    if (form.field === "BRANCH_GEOLOCATION" && !form.branchId) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const body = {
        field: form.field,
        reason: form.reason.trim(),
      };
      if (form.field === "BRANCH_GEOLOCATION") {
        body.branchId = form.branchId;
        if (form.latitude && form.longitude) {
          body.requestedValue = {
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
          };
        }
        if (form.address.trim()) {
          body.address = form.address.trim();
        }
      } else {
        body.requestedValue = form.requestedValue.trim();
      }

      await api.post("/change-requests", body);
      setFeedback({ type: "success", message: "Change request submitted successfully. The platform admin will review it shortly." });
      setForm(initialForm);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isGeoField = form.field === "BRANCH_GEOLOCATION";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Change Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Submit requests to the platform for approval</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">New Change Request</h2>

        {feedback && (
          <div className={`flex items-start gap-3 p-3 rounded-lg text-sm mb-4 ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {feedback.type === "success" ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">What do you want to change? *</label>
            <select
              value={form.field}
              onChange={(e) => updateForm("field", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select a field</option>
              {CHANGE_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {form.field === "COMPANY_NAME" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">New Company Name *</label>
              <input
                value={form.requestedValue}
                onChange={(e) => updateForm("requestedValue", e.target.value)}
                placeholder="Enter the new company name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          )}

          {isGeoField && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Select Branch *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => updateForm("branchId", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">New Address & Location *</label>
                <AddressMapPicker
                  address={form.address}
                  latitude={form.latitude ? Number(form.latitude) : undefined}
                  longitude={form.longitude ? Number(form.longitude) : undefined}
                  onChange={({ address, latitude, longitude }) => setForm((prev) => ({
                    ...prev,
                    address,
                    latitude: String(latitude),
                    longitude: String(longitude),
                  }))}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Reason *</label>
            <textarea
              value={form.reason}
              onChange={(e) => updateForm("reason", e.target.value)}
              rows={3}
              placeholder="Why are you requesting this change?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              required
              minLength={3}
            />
          </div>

          <div className="pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
