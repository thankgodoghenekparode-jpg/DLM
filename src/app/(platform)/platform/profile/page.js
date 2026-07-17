"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import { useAuth } from "@/context/AuthContext";
import { User, Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function PlatformProfilePage() {
  const { user, changePassword } = useAuth();
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      alert("Both fields are required");
      return;
    }
    if (newPassword.length < 10) {
      alert("New password must be at least 10 characters");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      alert("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      alert(err.message || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  const roleLabels = { SUPER_ADMIN: "Super Admin", PLATFORM_SUPPORT: "Platform Support" };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-bold text-xl">{(user?.fullName || user?.name || "U")[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.fullName || user?.name || "—"}</p>
            <p className="text-sm text-gray-500">{roleLabels[user?.role] || user?.role || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-500">Full Name</label><input defaultValue={user?.fullName || user?.name || ""} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50" /></div>
          <div><label className="text-xs text-gray-500">Email</label><input defaultValue={user?.email || ""} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50" /></div>
          <div><label className="text-xs text-gray-500">Phone</label><input defaultValue={user?.phone || ""} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50" /></div>
          <div><label className="text-xs text-gray-500">Role</label><p className="text-sm font-medium text-gray-900 mt-2">{roleLabels[user?.role] || user?.role || "—"}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} /> Change Password</h3>
        <div className="space-y-3 max-w-sm">
          <div className="relative">
            <input
              type={showOldPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowOldPw(!showOldPw)}>{showOldPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPw(!showNewPw)}>{showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <Button size="sm" onClick={handleChangePassword} disabled={pwLoading}>
            {pwLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}
