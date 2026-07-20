"use client";

import { useState, useEffect } from "react";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { FileText, Download, Loader2, Receipt, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import {
  TICKET_STATUSES,
  VEHICLE_STATUSES,
  DRIVER_STATUSES,
  FORMAT_OPTIONS,
  getLabel,
} from "@/lib/constants";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(headers, rows) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `report_${new Date().toISOString().slice(0, 10)}.csv`);
}

async function downloadAsFormat(baseUrl, format, filename) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${baseUrl}?format=${format}`;
    const token = api.getToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    downloadBlob(blob, `${filename}.${format}`);
  } catch (err) {
    alert(err.message || `Failed to download ${format.toUpperCase()}`);
  }
}

export default function ReportsPage() {
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tickets").catch(() => []),
      api.get("/vehicles").catch(() => []),
      api.get("/drivers").catch(() => []),
    ])
      .then(([t, v, d]) => {
        setTickets(Array.isArray(t) ? t : []);
        setVehicles(Array.isArray(v) ? v : []);
        setDrivers(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchInvoices = async (format) => {
    if (format === "json") {
      setInvoicesLoading(true);
      try {
        const data = await api.get("/billing/invoices");
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        alert(err.message || "Failed to fetch invoices");
      } finally {
        setInvoicesLoading(false);
      }
    } else {
      await downloadAsFormat("/billing/invoices", format, "invoices");
    }
  };

  const fetchStatement = async (format) => {
    setStatementsLoading(true);
    try {
      if (format === "json") {
        const data = await api.get("/wallet/statements");
        alert(`Statement generated: ${data.transactions?.length || 0} transactions`);
      } else {
        await downloadAsFormat("/wallet/statements", format, "wallet-statement");
      }
    } catch (err) {
      alert(err.message || "Failed to generate statement");
    } finally {
      setStatementsLoading(false);
    }
  };

  const ticketByStatus = TICKET_STATUSES.map((s) => ({
    label: s.label,
    count: tickets.filter((t) => t.status === s.value).length,
  })).filter((s) => s.count > 0);

  const vehicleByStatus = VEHICLE_STATUSES.map((s) => ({
    label: s.label,
    count: vehicles.filter((v) => v.status === s.value).length,
  })).filter((s) => s.count > 0);

  const driverByStatus = DRIVER_STATUSES.map((s) => ({
    label: s.label,
    count: drivers.filter((d) => d.status === s.value).length,
  })).filter((s) => s.count > 0);

  const exportTickets = () => {
    const headers = ["Ticket #", "Origin", "Destination", "Status", "Priority", "Created"];
    const rows = tickets.map((t) => [t.ticketNumber, t.originAddress, t.destinationAddress, t.status, t.priority, t.createdAt]);
    toCSV(headers, rows);
  };

  const exportVehicles = () => {
    const headers = ["Plate Number", "Type", "Status", "Owner"];
    const rows = vehicles.map((v) => [v.plateNumber, v.type, v.status, v.ownership]);
    toCSV(headers, rows);
  };

  const exportDrivers = () => {
    const headers = ["Name", "Phone", "Email", "Status", "License #"];
    const rows = drivers.map((d) => [d.fullName, d.phone, d.email, d.status, d.licenseNumber]);
    toCSV(headers, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Operational overview and data export</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
          <p className="text-xs text-gray-500">Total Tickets</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
          <p className="text-xs text-gray-500">Total Vehicles</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
          <p className="text-xs text-gray-500">Total Drivers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tickets by Status</h3>
          <div className="space-y-2">
            {ticketByStatus.map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
            {ticketByStatus.length === 0 && <p className="text-xs text-gray-400">No tickets</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Vehicles by Status</h3>
          <div className="space-y-2">
            {vehicleByStatus.map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
            {vehicleByStatus.length === 0 && <p className="text-xs text-gray-400">No vehicles</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Drivers by Status</h3>
          <div className="space-y-2">
            {driverByStatus.map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
            {driverByStatus.length === 0 && <p className="text-xs text-gray-400">No drivers</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Export Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={exportTickets} className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5">
            <FileText size={20} className="text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">Ticket Report</p>
            <p className="text-xs text-gray-500 mt-1">Export all tickets as CSV</p>
          </button>
          <button onClick={exportVehicles} className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5">
            <FileText size={20} className="text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">Vehicle Report</p>
            <p className="text-xs text-gray-500 mt-1">Export all vehicles as CSV</p>
          </button>
          <button onClick={exportDrivers} className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5">
            <FileText size={20} className="text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">Driver Report</p>
            <p className="text-xs text-gray-500 mt-1">Export all drivers as CSV</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Receipt size={16} /> Billing Invoices</h3>
        {invoices.length > 0 && (
          <div className="mb-3 text-sm text-gray-600">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} fetched</div>
        )}
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((fmt) => (
            <Button key={fmt.value} variant="secondary" size="sm" onClick={() => fetchInvoices(fmt.value)} disabled={invoicesLoading}>
              {invoicesLoading && fmt.value === "json" ? <Loader2 size={14} className="animate-spin mr-1" /> : <Download size={14} className="mr-1" />}
              {fmt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Wallet size={16} /> Wallet Statement</h3>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((fmt) => (
            <Button key={fmt.value} variant="secondary" size="sm" onClick={() => fetchStatement(fmt.value)} disabled={statementsLoading}>
              {statementsLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Download size={14} className="mr-1" />}
              {fmt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
