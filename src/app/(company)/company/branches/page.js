"use client";

import { useState, useEffect } from "react";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import DataTable from "@/components/shared/DataTable";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Loader2, AlertCircle } from "lucide-react";

const columns = (onEdit) => [
  { header: "Name", accessor: "name", sortable: true },
  { header: "Address", accessor: "address", sortable: true },
  { header: "Phone", accessor: "phone", sortable: true },
  { header: "Manager ID", accessor: "managerId", sortable: true, render: (row) => row.managerId || "-" },
  { header: "Created", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-" },
  { header: "", accessor: "actions", render: (row) => <button onClick={() => onEdit(row)} className="text-gray-400 hover:text-primary"><Pencil size={16} /></button> },
];

const emptyForm = { name: "", address: "", phone: "", managerId: "" };

export default function BranchesPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    api.get("/branches")
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openAdd = () => { setForm(emptyForm); setShowAdd(true); };

  const openEdit = (branch) => {
    setEditBranch(branch);
    setForm({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      managerId: branch.managerId || "",
    });
    setShowEdit(true);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        address: form.address.trim(),
      };
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.managerId.trim()) body.managerId = form.managerId.trim();

      const newBranch = await api.post(`/tenants/${tenantId}/branches`, body);
      setBranches((prev) => [...prev, newBranch]);
      setShowAdd(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        address: form.address.trim(),
      };
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.managerId.trim()) body.managerId = form.managerId.trim();

      const updated = await api.patch(`/tenants/${tenantId}/branches/${editBranch.id}`, body);
      setBranches((prev) => prev.map((b) => (b.id === editBranch.id ? updated : b)));
      setShowEdit(false);
      setEditBranch(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={20} className="mx-auto text-red-500 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your company branches and locations</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} className="mr-1" /> Add Branch</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns(openEdit)} data={branches} searchable />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Branch">
        <div className="space-y-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Branch Name *</label><input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Address *</label><input value={form.address} onChange={(e) => updateForm("address", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Manager ID</label><input value={form.managerId} onChange={(e) => updateForm("managerId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Add Branch
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Branch">
        <div className="space-y-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Branch Name *</label><input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Address *</label><input value={form.address} onChange={(e) => updateForm("address", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Manager ID</label><input value={form.managerId} onChange={(e) => updateForm("managerId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleEdit} disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
