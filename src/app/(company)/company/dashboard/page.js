"use client";

import { useState, useEffect, useMemo } from "react";
import KPICard from "@/components/shared/KPICard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Ticket, CheckCircle2, Truck, Wallet, Loader2, PackagePlus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { TICKET_PRIORITIES, getLabel } from "@/lib/constants";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthlyCounts(items, dateField) {
  const counts = new Array(12).fill(0);
  const now = new Date();
  const year = now.getFullYear();
  items.forEach((item) => {
    const d = item[dateField];
    if (!d) return;
    const dt = new Date(d);
    if (dt.getFullYear() === year) counts[dt.getMonth()]++;
  });
  return counts;
}

function getMonthlySums(transactions) {
  const sums = new Array(12).fill(0);
  const now = new Date();
  const year = now.getFullYear();
  transactions.forEach((tx) => {
    const d = tx.createdAt;
    if (!d) return;
    const dt = new Date(d);
    if (dt.getFullYear() === year && tx.type !== "FUND" && tx.type !== "REFUND") {
      sums[dt.getMonth()] += Math.abs(tx.amount || 0);
    }
  });
  return sums;
}

export default function CompanyDashboard() {
  const [metrics, setMetrics] = useState({ openTickets: 0, activeTrips: 0, walletBalance: 0 });
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [walletTx, setWalletTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [summaryData, ticketData, vehicleData, txData] = await Promise.all([
        api.get("/metrics/tenant-summary").catch(() => null),
        api.get("/tickets").catch(() => []),
        api.get("/vehicles").catch(() => []),
        api.get("/wallet/transactions").catch(() => []),
      ]);
      if (summaryData) {
        const metricMap = {};
        (summaryData.metrics || []).forEach((m) => { metricMap[m.label] = m.value; });
        setMetrics({
          openTickets: metricMap["Open Tickets"] || 0,
          activeTrips: metricMap["Active Trips"] || 0,
          walletBalance: summaryData.wallet?.balance?.amount || 0,
        });
      }
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setWalletTx(Array.isArray(txData) ? txData : []);
      setLoading(false);
    };
    load();
  }, []);

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(
    (v) => v.status === "ACTIVE" || v.status === "ON_TRANSIT"
  ).length;
  const fleetUtilization = totalVehicles
    ? Math.round((activeVehicles / totalVehicles) * 100)
    : 0;

  const recentTickets = tickets.slice(0, 10);

  const ticketCounts = useMemo(() => getMonthlyCounts(tickets, "createdAt"), [tickets]);
  const walletSpend = useMemo(() => getMonthlySums(walletTx), [walletTx]);
  const maxTicket = Math.max(...ticketCounts, 1);
  const maxSpend = Math.max(...walletSpend, 1);

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
      render: (row) => `${row.originAddress || "—"} → ${row.destinationAddress || "—"}`,
    },
    { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { header: "Driver", accessor: "driverId", sortable: true, render: (row) => row.driverId || "—" },
    { header: "Priority", accessor: "priority", sortable: true, render: (row) => getLabel(TICKET_PRIORITIES, row.priority) },
    { header: "Date", accessor: "createdAt", sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
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
        <button className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, here&apos;s your overview.</p>
        </div>
        <Link href="/company/create-parcel" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          <PackagePlus size={16} /> Create Parcel
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Tickets" value={metrics.openTickets} icon={Ticket} subtitle="Require attention" />
        <KPICard title="Active Trips" value={metrics.activeTrips} icon={CheckCircle2} subtitle="In progress" />
        <KPICard title="Fleet Utilization" value={`${fleetUtilization}%`} icon={Truck} subtitle={`${activeVehicles} of ${totalVehicles} vehicles`} />
        <KPICard title="Wallet Balance" value={`₦${metrics.walletBalance.toLocaleString()}`} icon={Wallet} subtitle="Available balance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tickets This Year</h3>
          <div className="h-48 flex items-end gap-2">
            {ticketCounts.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/20 rounded-t" style={{ height: `${(h / maxTicket) * 100}%` }}><div className="w-full bg-primary rounded-t" style={{ height: `${h > 0 ? 70 : 0}%` }} /></div>
                <span className="text-[10px] text-gray-500">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Wallet Spend This Year</h3>
          <div className="h-48 flex items-end gap-2">
            {walletSpend.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-green-200 rounded-t" style={{ height: `${(h / maxSpend) * 100}%` }}><div className="w-full bg-green-500 rounded-t" style={{ height: `${h > 0 ? 80 : 0}%` }} /></div>
                <span className="text-[10px] text-gray-500">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Tickets</h3>
        <DataTable columns={columns} data={recentTickets} searchable />
      </div>
    </div>
  );
}
