"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/shared/Button";
import { User, Calendar, Phone, Mail, Send, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DriverProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ fullName: "", phone: "", email: "" });

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get("/auth/me");
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const startEditing = () => {
    setEditData({ fullName: user.fullName || "", phone: user.phone || "", email: user.email || "" });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await api.patch("/auth/me", {
        phone: editData.phone,
        email: editData.email,
      });
      setUser({ ...user, ...updated });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your driver profile</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading profile...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle size={20} className="mr-2" />
          {error}
          <button onClick={fetchProfile} className="ml-3 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && user && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                <User size={36} className="text-gray-400" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{user.fullName}</h3>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={14} /> {user.phone || "—"}</span>
                  <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </p>
              <p className="text-xs text-gray-500">Joined</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{user.role || "Driver"}</p>
              <p className="text-xs text-gray-500">Role</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={16} /> Personal Info
            </h3>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Full Name"
                  />
                  <input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Phone"
                  />
                </div>
                <input
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Email"
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 flex items-center gap-1"><Phone size={14} /> Phone</span>
                    <p className="font-medium mt-0.5">{user.phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1"><Mail size={14} /> Email</span>
                    <p className="font-medium mt-0.5">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Joined</span>
                    <p className="font-medium mt-0.5">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={startEditing}>
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
