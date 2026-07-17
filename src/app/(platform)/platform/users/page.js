"use client";

import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { UserPlus, Pencil, MoreVertical, Shield, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PLATFORM_ROLES, getLabel } from "@/lib/constants";

export default function PlatformUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "PLATFORM_SUPPORT" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const staffUsers = useMemo(() => users.filter((u) => u.role !== "SUPER_ADMIN"), [users]);

  const fetchUsers = () => {
    api.get("/platform/users")
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load users"); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const inputClass = (field) => `w-full border rounded-lg px-3 py-2 text-sm ${errors[field] ? "border-red-400" : "border-gray-300"}`;

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm({ fullName: "", email: "", phone: "", role: "PLATFORM_SUPPORT" });
    setErrors({});
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/platform/users", { fullName: form.fullName, email: form.email, phone: form.phone, role: form.role });
      alert(`Staff "${form.fullName}" created successfully.`);
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    if (user.role === "SUPER_ADMIN" || user.id === currentUser?.id) return;
    setForm({ fullName: user.fullName || user.name, email: user.email, phone: user.phone || "", role: user.role });
    setErrors({});
    setEditUser(user);
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.patch(`/platform/users/${editUser.id}/role`, { role: form.role });
      alert(`Staff role updated successfully.`);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === "SUPER_ADMIN" || user.id === currentUser?.id) return;
    const newActive = user.isActive === false ? true : false;
    const action = newActive ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} "${user.fullName || user.name}"?`)) return;
    try {
      await api.patch(`/platform/users/${user.id}/status`, { isActive: newActive, reason: `${action}d by platform` });
      alert(`"${user.fullName || user.name}" is now ${action}d.`);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const columns = [
    { header: "Name", accessor: "fullName", sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.fullName || row.name}</span> },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Phone", accessor: "phone", sortable: true, render: (row) => row.phone || "—" },
    { header: "Role", accessor: "role", sortable: true, render: (row) => <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"><Shield size={12} /> {getLabel(PLATFORM_ROLES, row.role)}</span> },
    { header: "Status", accessor: "isActive", sortable: true, render: (row) => <StatusBadge status={row.isActive !== false ? "ACTIVE" : "INACTIVE"} /> },
    {
      header: "Actions", accessor: null, render: (row) => {
        const isProtected = row.role === "SUPER_ADMIN" || row.id === currentUser?.id;
        return (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className={`p-1.5 rounded-lg ${isProtected ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-primary hover:bg-primary/5"}`} title={isProtected ? "Cannot edit this user" : "Edit Role"} disabled={isProtected}><Pencil size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }} className={`p-1.5 rounded-lg ${isProtected ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"}`} title={isProtected ? "Cannot modify this user" : row.isActive !== false ? "Deactivate" : "Activate"} disabled={isProtected}>
              {row.isActive !== false ? <span className="block w-3.5 h-3.5 rounded-full border-2 border-current" /> : <span className="block w-3.5 h-3.5 rounded-full bg-current border-2 border-current" />}
            </button>
          </div>
        );
      },
    },
  ];

  const renderForm = () => (
    <div className="space-y-3">
      <div><label className="text-xs text-gray-500 mb-1 block">Full Name *</label><input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass("fullName")} placeholder="e.g. John Doe" />{errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}</div>
      <div><label className="text-xs text-gray-500 mb-1 block">Email *</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass("email")} placeholder="e.g. john@dlm.com" />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
      <div><label className="text-xs text-gray-500 mb-1 block">Phone *</label><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass("phone")} placeholder="e.g. 0803-111-2222" />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}</div>
      <div><label className="text-xs text-gray-500 mb-1 block">Role *</label><select value={form.role} onChange={(e) => update("role", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{PLATFORM_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
    </div>
  );

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
          <h1 className="text-xl font-bold text-gray-900">Platform Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage DLM staff accounts</p>
        </div>
        <Button onClick={openCreate}><UserPlus size={16} className="mr-1" /> Create Staff</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{staffUsers.length}</p>
          <p className="text-xs text-gray-500">Total Staff</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-green-600">{staffUsers.filter((u) => u.isActive !== false).length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-red-600">{staffUsers.filter((u) => u.isActive === false).length}</p>
          <p className="text-xs text-gray-500">Inactive</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={staffUsers} searchable />
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Staff">
        {renderForm()}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
            {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Create Staff
          </Button>
        </div>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit Staff Role">
        {editUser && (
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Staff</label><p className="text-sm font-medium text-gray-900">{editUser.fullName || editUser.name}</p></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Email</label><p className="text-sm text-gray-700">{editUser.email}</p></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Role *</label><select value={form.role} onChange={(e) => update("role", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{PLATFORM_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
          <Button className="flex-1" onClick={handleEdit} disabled={submitting}>
            {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
