"use client";

import { useState, useEffect, useCallback } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import { MapPin, Clock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const COMPLETED_STATUSES = ["DELIVERED", "CLOSED", "CANCELLED"];

export default function DriverHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get("/driver/tasks");
      setHistory(data.filter((t) => COMPLETED_STATUSES.includes(t.status)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-1">Past trips and deliveries</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading history...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle size={20} className="mr-2" />
          {error}
          <button onClick={fetchHistory} className="ml-3 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="text-center text-gray-500 py-12">No completed trips yet.</p>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {history.map((trip) => (
            <Link
              key={trip.ticketId}
              href={`/driver/trips/${trip.ticketId}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{trip.ticketNumber}</span>
                <StatusBadge status={trip.status} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-600">{trip.originAddress} → {trip.destinationAddress}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {trip.lastPingAt ? new Date(trip.lastPingAt).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—"}
                </span>
                {trip.etaMinutes != null && (
                  <span>ETA was {trip.etaMinutes} min</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
