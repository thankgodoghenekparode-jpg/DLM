"use client";

import { useState, useEffect } from "react";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Building2, User, Shield, Eye, EyeOff, Send, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

export default function CompanyProfilePage() {
  const { user, changePassword } = useAuth();

  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeField, setChangeField] = useState("");
  const [changeFieldKey, setChangeFieldKey] = useState("");
  const [changeValue, setChangeValue] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    const load = async () => {
      const [tenantData, subData] = await Promise.all([
        api.get(`/tenants/${user.tenantId}`).catch(() => null),
        api.get("/billing/subscription").catch(() => null),
      ]);
      if (!tenantData) {
        setError("Failed to load profile");
      } else {
        setTenant(tenantData);
      }
      setSubscription(subData);
      setLoading(false);
    };
    load();
  }, [user?.tenantId]);

  const kycBadge = {
    VERIFIED: { icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200", label: "Verified" },
    PENDING: { icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200", label: "Pending" },
    NOT_SUBMITTED: { icon: AlertCircle, color: "text-gray-600 bg-gray-50 border-gray-200", label: "Not Submitted" },
  };

  const badge = kycBadge[tenant?.kycStatus] || kycBadge.NOT_SUBMITTED;
  const BadgeIcon = badge.icon;

  const openChangeRequest = (label, key, currentValue) => {
    setChangeField(label);
    setChangeFieldKey(key);
    setChangeValue(currentValue);
    setChangeReason("");
    setShowChangeModal(true);
  };

  const handleChangeRequest = async () => {
    if (!changeValue.trim() || !changeReason.trim()) return;
    const fieldDef = editableFields.find((f) => f.key === changeFieldKey);
    if (!fieldDef?.backendField) {
      alert("This field cannot be changed via change request. Please contact support.");
      return;
    }
    setChangeLoading(true);
    try {
      await api.post("/change-requests", {
        field: fieldDef.backendField,
        requestedValue: changeValue,
        reason: changeReason,
      });
      setShowChangeModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setChangeLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return;
    setPwLoading(true);
    setPwMessage(null);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.accepted) {
        setPwMessage({ type: "success", text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPwMessage({ type: "error", text: "Password change was not accepted." });
      }
    } catch (err) {
      setPwMessage({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertCircle size={20} className="mx-auto text-red-500 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const editableFields = [
    { label: "Company Name", value: tenant?.companyName || "", key: "companyName", backendField: "COMPANY_NAME" },
    { label: "Email", value: tenant?.email || "", key: "email" },
    { label: "Phone", value: tenant?.phone || "", key: "phone" },
    { label: "Address", value: tenant?.address || "", key: "address" },
  ];

  const planLabel = subscription?.planName || subscription?.plan?.name || subscription?.planId?.toUpperCase() || "N/A";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your company and account</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Building2 size={16} /> Company Profile</h3>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${badge.color}`}>
            <BadgeIcon size={12} />
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Changes to company info require a change request sent to the platform for approval.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editableFields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-500">{f.label}</label>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium text-gray-900 flex-1">{f.value}</p>
                <button onClick={() => openChangeRequest(f.label, f.key, f.value)} className="text-xs text-primary hover:underline flex-shrink-0">Change</button>
              </div>
            </div>
          ))}
          <div><label className="text-xs text-gray-500">Current Plan</label><p className="text-sm font-medium text-gray-900 mt-0.5">{planLabel}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><User size={16} /> Personal Info</h3>
        <p className="text-xs text-gray-500 mb-4">Your account details from authentication.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-500">Full Name</label><p className="text-sm font-medium text-gray-900 mt-1">{user?.fullName || "-"}</p></div>
          <div><label className="text-xs text-gray-500">Email</label><p className="text-sm font-medium text-gray-900 mt-1">{user?.email || "-"}</p></div>
          <div><label className="text-xs text-gray-500">Phone</label><p className="text-sm font-medium text-gray-900 mt-1">{user?.phone || "-"}</p></div>
          <div><label className="text-xs text-gray-500">Role</label><p className="text-sm font-medium text-gray-900 mt-1">{user?.role || "-"}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} /> Change Password</h3>
        <div className="space-y-3 max-w-sm">
          <div className="relative">
            <input type={showOldPw ? "text" : "password"} placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowOldPw(!showOldPw)}>{showOldPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <div className="relative">
            <input type={showNewPw ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPw(!showNewPw)}>{showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          {pwMessage && (
            <p className={`text-xs ${pwMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{pwMessage.text}</p>
          )}
          <Button size="sm" onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Update Password
          </Button>
        </div>
      </div>

      <Modal open={showChangeModal} onClose={() => setShowChangeModal(false)} title="Request Change">
        <div className="space-y-4">
          <div><label className="text-xs text-gray-500 mb-1 block">Field</label><p className="text-sm font-medium text-gray-900">{changeField}</p></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Current Value</label><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{changeValue}</p></div>
          <div><label className="text-xs text-gray-500 mb-1 block">New Value</label><input value={changeValue} onChange={(e) => setChangeValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Reason for Change</label><textarea value={changeReason} onChange={(e) => setChangeReason(e.target.value)} placeholder="Explain why this change is needed..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowChangeModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleChangeRequest} disabled={changeLoading}>
              {changeLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
