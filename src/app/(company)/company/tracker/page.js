"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { Truck, Clock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const TRACKER_STEPS = ["Assigned", "Picked Up", "In Transit", "Delivered"];

function statusToStep(status) {
  const map = { ASSIGNED: 0, PICKED_UP: 1, IN_TRANSIT: 2, DELIVERED: 3 };
  return map[status] ?? 0;
}

function StepTracker({ currentStep }) {
  return (
    <div className="flex items-center justify-between relative min-w-[280px]">
      <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-gray-200" />
      <div
        className="absolute top-2.5 left-0 h-0.5 bg-primary"
        style={{ width: `${(currentStep / (TRACKER_STEPS.length - 1)) * 100}%` }}
      />
      {TRACKER_STEPS.map((step, i) => (
        <div key={step} className="relative flex flex-col items-center z-10" style={{ width: `${100 / TRACKER_STEPS.length}%` }}>
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium border-2 ${
              i <= currentStep ? "bg-primary border-primary text-white" : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {i <= currentStep ? "✓" : i + 1}
          </div>
          <p className={`text-[9px] mt-1.5 text-center whitespace-nowrap ${i <= currentStep ? "text-primary font-medium" : "text-gray-400"}`}>
            {step}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatEta(minutes) {
  if (minutes == null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function KPICard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}

export default function TrackerPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [etas, setEtas] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const allTickets = await api.get("/tickets");
        if (cancelled) return;

        const inTransit = allTickets.filter((t) => t.status === "IN_TRANSIT");
        setTickets(inTransit);

        const etaResults = await Promise.allSettled(
          inTransit.map((t) => api.get(`/tickets/${t.id}/eta`))
        );
        if (cancelled) return;

        const etaMap = {};
        etaResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            etaMap[inTransit[i].id] = result.value;
          }
        });
        setEtas(etaMap);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load tracker data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const avgEtaMinutes = tickets.length
    ? tickets.reduce((sum, t) => sum + (etas[t.id]?.etaMinutes ?? 0), 0) / tickets.length
    : 0;

  const columns = [
    {
      header: "Ticket #",
      accessor: "ticketNumber",
      sortable: true,
      render: (row) => (
        <Link href={`/company/tickets/${row.id}`} className="text-primary hover:underline font-medium">
          {row.ticketNumber}
        </Link>
      ),
    },
    {
      header: "Route",
      accessor: "originAddress",
      sortable: false,
      render: (row) => (
        <span className="text-sm">
          {row.originAddress} → {row.destinationAddress}
        </span>
      ),
    },
    { header: "Vehicle", accessor: "vehicleId", sortable: true },
    { header: "Driver", accessor: "driverId", sortable: true },
    {
      header: "Progress",
      accessor: "_progress",
      sortable: false,
      render: (row) => <StepTracker currentStep={statusToStep(row.status)} />,
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "ETA",
      accessor: "etaMinutes",
      sortable: false,
      render: (row) => formatEta(etas[row.id]?.etaMinutes),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">All in-transit vehicles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="In Transit" value={loading ? "—" : tickets.length} icon={Truck} subtitle="Active shipments" />
        <KPICard title="Avg ETA" value={loading ? "—" : formatEta(avgEtaMinutes)} icon={Clock} subtitle="Remaining" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading tracker data...</div>
        ) : (
          <DataTable columns={columns} data={tickets} searchable />
        )}
      </div>
    </div>
  );
}
