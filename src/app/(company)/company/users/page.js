"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { COMPANY_ROLES, getLabel } from "@/lib/constants";
import { UserPlus, Pencil, Ban, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const ROLE_FILTERS = ["ALL", ...COMPANY_ROLES.map((r) => r.value)];

const buildColumns = (onEdit, onToggleStatus) => [
  { header: "Name", accessor: "fullName", sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.fullName}</span> },
  { header: "Email", accessor: "email", sortable: true },
  { header: "Phone", accessor: "phone", sortable: true },
  { header: "Role", accessor: "role", sortable: true, render: (row) => <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">{getLabel(COMPANY_ROLES, row.role)}</span> },
  { header: "Status", accessor: "isActive", sortable: true, render: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
  { header: "Created", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
  { header: "", accessor: "actions", render: (row) => (
    <div className="flex gap-1">
      <button onClick={() => onEdit(row)} className="text-gray-400 hover:text-primary p-1" title="Edit Role"><Pencil size={14} /></button>
      <button onClick={() => onToggleStatus(row)} className="text-gray-400 hover:text-yellow-600 p-1" title={row.isActive ? "Deactivate" : "Activate"}>
        {row.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
      </button>
    </div>
  )},
];

export default function UsersPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showToggleStatus, setShowToggleStatus] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toggleStatusUser, setToggleStatusUser] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "DISPATCH_MANAGER" });
  const [editRole, setEditRole] = useState("");
  const [toggleReason, setToggleReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    try {
      const data = await api.get(`/tenants/${tenantId}/users`);
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (statusFilter === "ACTIVE" && !u.isActive) return false;
    if (statusFilter === "INACTIVE" && u.isActive) return false;
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    return true;
  });

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setForm({ fullName: "", email: "", phone: "", role: "DISPATCH_MANAGER" });
    setActionError(null);
    setShowCreate(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditRole(u.role);
    setActionError(null);
    setShowEdit(true);
  };

  const openToggleStatus = (u) => {
    setToggleStatusUser(u);
    setToggleReason("");
    setActionError(null);
    setShowToggleStatus(true);
  };

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.role) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const newUser = await api.post(`/tenants/${tenantId}/users`, form);
      setUsers((prev) => [...prev, newUser]);
      setShowCreate(false);
    } catch (err) {
      setActionError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editRole) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await api.patch(`/users/${editUser.id}/role`, { role: editRole });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setShowEdit(false);
      setEditUser(null);
    } catch (err) {
      setActionError(err.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleReason.trim()) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await api.patch(`/users/${toggleStatusUser.id}/status`, {
        isActive: !toggleStatusUser.isActive,
        reason: toggleReason.trim(),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setShowToggleStatus(false);
      setToggleStatusUser(null);
    } catch (err) {
      setActionError(err.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-500">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <AlertCircle size={24} className="text-red-500" />
        <span className="ml-2 text-sm text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members and their roles</p>
        </div>
        <Button onClick={openCreate}><UserPlus size={16} className="mr-1" /> Create User</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Status:</span>
          {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-full ${statusFilter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Role:</span>
          {ROLE_FILTERS.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-2.5 py-1 rounded-full ${roleFilter === r ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{r === "ALL" ? "ALL" : getLabel(COMPANY_ROLES, r)}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={buildColumns(openEdit, openToggleStatus)} data={filtered} searchable />
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <div className="space-y-3">
          {actionError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>}
          <div><label className="text-xs text-gray-500 mb-1 block">Full Name *</label><input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Email *</label><input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Phone *</label><input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Role *</label><select value={form.role} onChange={(e) => updateForm("role", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{COMPANY_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={submitting}>{submitting ? "Creating..." : "Create User"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Role">
        <div className="space-y-3">
          {actionError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>}
          <p className="text-sm text-gray-600">Update role for <strong>{editUser?.fullName}</strong></p>
          <div><label className="text-xs text-gray-500 mb-1 block">Role</label><select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{COMPANY_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleEdit} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showToggleStatus} onClose={() => setShowToggleStatus(false)} title={toggleStatusUser?.isActive ? "Deactivate User" : "Activate User"}>
        <div className="space-y-3">
          {actionError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>}
          <p className="text-sm text-gray-600">
            Are you sure you want to {toggleStatusUser?.isActive ? "deactivate" : "activate"} <strong>{toggleStatusUser?.fullName}</strong>?
          </p>
          <div><label className="text-xs text-gray-500 mb-1 block">Reason *</label><textarea value={toggleReason} onChange={(e) => setToggleReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Provide a reason..." required /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowToggleStatus(false)}>Cancel</Button>
            <Button variant={toggleStatusUser?.isActive ? "danger" : "primary"} className="flex-1" onClick={handleToggleStatus} disabled={submitting || !toggleReason.trim()}>{submitting ? "Processing..." : toggleStatusUser?.isActive ? "Deactivate" : "Activate"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
