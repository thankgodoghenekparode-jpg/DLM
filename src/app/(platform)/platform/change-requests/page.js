"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Loader2, CheckCircle, XCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { CHANGE_REQUEST_DECISIONS, getLabel } from "@/lib/constants";

export default function PlatformChangeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewDecision, setReviewDecision] = useState("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchRequests = () => {
    api.get("/change-requests")
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load change requests"); setLoading(false); });
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await api.patch(`/change-requests/${reviewTarget.id}/review`, {
        decision: reviewDecision,
        reviewNote: reviewNote.trim() || undefined,
      });
      setReviewTarget(null);
      setReviewNote("");
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to review request");
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "id", sortable: true },
    { header: "Tenant", accessor: "tenantId", sortable: true },
    { header: "Field", accessor: "field", sortable: true },
    { header: "Requested Value", accessor: "requestedValue", render: (row) => typeof row.requestedValue === "object" ? JSON.stringify(row.requestedValue) : String(row.requestedValue || "") },
    { header: "Reason", accessor: "reason", sortable: true },
    { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { header: "Date", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
    {
      header: "Actions", accessor: "id", render: (row) =>
        row.status === "PENDING" ? (
          <div className="flex gap-1">
            <button onClick={() => { setReviewTarget(row); setReviewDecision("APPROVED"); setReviewNote(""); }} className="text-green-600 hover:text-green-800" title="Approve"><CheckCircle size={16} /></button>
            <button onClick={() => { setReviewTarget(row); setReviewDecision("REJECTED"); setReviewNote(""); }} className="text-red-600 hover:text-red-800" title="Reject"><XCircle size={16} /></button>
          </div>
        ) : null,
    },
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
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Change Requests</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Change Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve/reject company requests</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        {requests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No change requests yet</p>
        ) : (
          <DataTable columns={columns} data={requests} searchable />
        )}
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setReviewTarget(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{reviewDecision === "APPROVED" ? "Approve" : "Reject"} Request</h3>
              <button onClick={() => setReviewTarget(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div><span className="text-gray-500">Field:</span> <span className="font-medium">{reviewTarget.field}</span></div>
              <div><span className="text-gray-500">Requested:</span> <span className="font-medium">{typeof reviewTarget.requestedValue === "object" ? JSON.stringify(reviewTarget.requestedValue) : String(reviewTarget.requestedValue || "")}</span></div>
              <div><span className="text-gray-500">Reason:</span> <span className="font-medium">{reviewTarget.reason}</span></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Decision *</label>
                <select value={reviewDecision} onChange={(e) => setReviewDecision(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CHANGE_REQUEST_DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Review Note</label><textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional note" /></div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleReview} disabled={reviewing}>
                {reviewing ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {reviewDecision === "APPROVED" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
