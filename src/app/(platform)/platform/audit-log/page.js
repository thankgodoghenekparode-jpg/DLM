"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/audit-log")
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load audit log"); setLoading(false); });
  }, []);

  const columns = [
    { header: "Action", accessor: "action", sortable: true },
    { header: "Actor", accessor: "actorUserId", sortable: true, render: (row) => row.actorUserId || "—" },
    { header: "Entity Type", accessor: "entityType", sortable: true, render: (row) => row.entityType || "—" },
    { header: "Entity ID", accessor: "entityId", sortable: true, render: (row) => row.entityId || "—" },
    { header: "Timestamp", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : "—" },
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
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all platform activity</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={logs} searchable />
      </div>
    </div>
  );
}
