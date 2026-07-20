"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { Plus, LayoutGrid, List, Loader2, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { TICKET_STATUSES, TICKET_PRIORITIES, getLabel } from "@/lib/constants";

const STATUS_KEYS = ["ALL", ...TICKET_STATUSES.map((s) => s.value)];
const PRIORITY_KEYS = ["ALL", ...TICKET_PRIORITIES.map((p) => p.value)];

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
    accessor: "_route",
    sortable: true,
    render: (row) => `${row.originAddress || "-"} -> ${row.destinationAddress || "-"}`,
  },
  { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  { header: "Driver", accessor: "_driverName", sortable: true, render: (row) => row._driverName || "-" },
  { header: "Vehicle", accessor: "_vehiclePlate", sortable: true, render: (row) => row._vehiclePlate || "-" },
  { header: "Priority", accessor: "priority", sortable: true, render: (row) => row.priority || "-" },
  { header: "Date", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-" },
];

const KANBAN_STATUSES = ["DRAFT", "PENDING_ASSIGNMENT", "ASSIGNED", "IN_TRANSIT", "DELIVERED"];

const KANBAN_COLORS = {
  DRAFT: "bg-gray-100",
  PENDING_ASSIGNMENT: "bg-blue-50",
  ASSIGNED: "bg-yellow-50",
  IN_TRANSIT: "bg-orange-50",
  DELIVERED: "bg-green-50",
};

export default function TicketsPage() {
  const [view, setView] = useState("kanban");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [tickets, setTickets] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [ticketData, driverData, vehicleData] = await Promise.all([
        api.get("/tickets").catch(() => []),
        api.get("/drivers").catch(() => []),
        api.get("/vehicles").catch(() => []),
      ]);
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setLoading(false);
    };
    load();
  }, []);

  const driverMap = {};
  drivers.forEach((d) => { driverMap[d.id] = d.fullName; });

  const vehicleMap = {};
  vehicles.forEach((v) => { vehicleMap[v.id] = v.plate || v.plateNumber; });

  const enriched = tickets.map((t) => ({
    ...t,
    _route: `${t.originAddress || "-"} -> ${t.destinationAddress || "-"}`,
    _driverName: t.driverId ? driverMap[t.driverId] || t.driverId : null,
    _vehiclePlate: t.vehicleId ? vehicleMap[t.vehicleId] || t.vehicleId : null,
  }));

  const filtered = enriched.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    return true;
  });

  const kanbanColumns = KANBAN_STATUSES.reduce((acc, s) => {
    acc[s] = { label: getLabel(TICKET_STATUSES, s), tickets: filtered.filter((t) => t.status === s), color: KANBAN_COLORS[s] };
    return acc;
  }, {});

  const vehicleLoads = Object.values(
    filtered.reduce((acc, ticket) => {
      const key = ticket.vehicleId || "unassigned";
      if (!acc[key]) {
        acc[key] = {
          id: key,
          label: ticket._vehiclePlate || "Unassigned vehicle",
          driver: ticket._driverName || "No driver",
          tickets: [],
        };
      }
      acc[key].tickets.push(ticket);
      return acc;
    }, {})
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
        <Button variant="secondary" className="mt-3" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tickets Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all job orders</p>
        </div>
        <Link href="/company/tickets/create">
          <Button><Plus size={16} className="mr-1" /> New Ticket</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        <button onClick={() => setView("kanban")} className={`p-2 rounded-lg ${view === "kanban" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`} title="Grid view"><LayoutGrid size={18} /></button>
        <button onClick={() => setView("table")} className={`p-2 rounded-lg ${view === "table" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`} title="List view"><List size={18} /></button>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Truck size={16} /> Vehicle Loads</h2>
            <p className="text-xs text-gray-500 mt-1">See tickets grouped under each vehicle.</p>
          </div>
          <span className="text-xs text-gray-500">{filtered.length} tickets</span>
        </div>
        {vehicleLoads.length === 0 ? (
          <p className="text-sm text-gray-500">No tickets match the selected filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {vehicleLoads.map((load) => (
              <div key={load.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{load.label}</p>
                  <p className="text-xs text-gray-500">{load.driver} - {load.tickets.length} ticket{load.tickets.length === 1 ? "" : "s"}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {load.tickets.slice(0, 5).map((ticket) => (
                    <Link key={ticket.id} href={`/company/tickets/${ticket.id}`} className="block px-3 py-2 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{ticket.ticketNumber || ticket.id}</p>
                      <p className="text-xs text-gray-500 truncate">{ticket.originAddress || "-"} {"->"} {ticket.destinationAddress || "-"}</p>
                    </Link>
                  ))}
                  {load.tickets.length > 5 && <p className="px-3 py-2 text-xs text-gray-500">+{load.tickets.length - 5} more tickets</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-2 flex-wrap">
        {STATUS_KEYS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-xs rounded-full ${statusFilter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s === "ALL" ? "All" : getLabel(TICKET_STATUSES, s)}
          </button>
        ))}
        <span className="w-px bg-gray-200 mx-1" />
        {PRIORITY_KEYS.map((p) => (
          <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1 text-xs rounded-full ${priorityFilter === p ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p === "ALL" ? "All" : getLabel(TICKET_PRIORITIES, p)}
          </button>
        ))}
      </div>

      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {Object.entries(kanbanColumns).map(([key, col]) => (
            <div key={key} className={`${col.color} rounded-xl p-4 min-h-[200px] sm:min-h-[300px]`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{col.label} ({col.tickets.length})</h3>
              <div className="space-y-2">
                {col.tickets.map((ticket) => (
                  <Link key={ticket.id} href={`/company/tickets/${ticket.id}`} className="block bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm">
                    <p className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.originAddress} {"->"} {ticket.destinationAddress}</p>
                    <p className="text-xs text-gray-500">{ticket._driverName || "Unassigned"}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
          <DataTable columns={columns} data={filtered} searchable />
        </div>
      )}
    </div>
  );
}
