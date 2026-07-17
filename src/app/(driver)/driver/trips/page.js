"use client";

import { useState, useEffect, useCallback } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import { MapPin, Clock, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getLabel, TICKET_STATUSES } from "@/lib/constants";

export default function DriverTripsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get("/driver/tasks");
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Trips</h1>
        <p className="text-sm text-gray-500 mt-1">Your assigned trips</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading trips...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle size={20} className="mr-2" />
          {error}
          <button onClick={fetchTasks} className="ml-3 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.ticketId}
              href={`/driver/trips/${task.ticketId}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-primary/50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">{task.ticketNumber}</span>
                <StatusBadge status={task.status} />
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-700">{task.originAddress} → {task.destinationAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-500">
                  {task.etaMinutes != null ? `ETA: ${task.etaMinutes} min` : "ETA: —"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{task.cargoDescription}</span>
                {task.pickupTime && (
                  <span>Pickup: {new Date(task.pickupTime).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">No trips assigned yet.</div>
      )}
    </div>
  );
}
