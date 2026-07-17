"use client";

import { useState, useEffect } from "react";
import KPICard from "@/components/shared/KPICard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { Building2, CreditCard, Users, TrendingUp, Loader2, Award } from "lucide-react";
import { api } from "@/lib/api";
import { TENANT_STATUSES, getLabel } from "@/lib/constants";

export default function PlatformDashboard() {
  const [summary, setSummary] = useState({ tenantCount: 0, activeSubscriptions: 0, monthlyRevenue: 0 });
  const [tenants, setTenants] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [summaryData, tenantData, userData, scorecardData] = await Promise.all([
        api.get("/metrics/platform-summary").catch(() => null),
        api.get("/platform/tenants").catch(() => []),
        api.get("/platform/users").catch(() => []),
        api.get("/metrics/driver-scorecards").catch(() => []),
      ]);
      if (summaryData) {
        const metricMap = {};
        (summaryData.metrics || []).forEach((m) => { metricMap[m.label] = m.value; });
        setSummary({
          tenantCount: metricMap["Total Companies"] || 0,
          activeSubscriptions: metricMap["Active Subscriptions"] || 0,
          monthlyRevenue: metricMap["Monthly Revenue"] || 0,
        });
      }
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setStaffCount(Array.isArray(userData) ? userData.filter((u) => u.role !== "SUPER_ADMIN").length : 0);
      setScorecards(Array.isArray(scorecardData) ? scorecardData : []);
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { header: "Company", accessor: "companyName", sortable: true, render: (row) => <Link href={`/platform/companies/${row.id}`} className="text-primary hover:underline font-medium">{row.companyName || row.name}</Link> },
    { header: "Plan", accessor: "plan", sortable: true, render: (row) => row.plan?.name || "—" },
    { header: "Status", accessor: "status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { header: "Email", accessor: "email", sortable: true },
  ];

  const scorecardColumns = [
    { header: "Driver", accessor: "driverName", sortable: true },
    { header: "Completed Trips", accessor: "completedTrips", sortable: true },
    { header: "On-Time Rate", accessor: "onTimeRate", sortable: true, render: (row) => `${(row.onTimeRate * 100).toFixed(0)}%` },
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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all companies and platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Companies" value={summary.tenantCount} icon={Building2} subtitle="Registered companies" />
        <KPICard title="Active Subscriptions" value={summary.activeSubscriptions} icon={TrendingUp} subtitle="Currently active" />
        <KPICard title="Monthly Revenue" value={`₦${(summary.monthlyRevenue || 0).toLocaleString()}`} icon={CreditCard} subtitle="This month" />
        <KPICard title="Total Staff" value={staffCount} icon={Users} subtitle="Platform administrators" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">All Companies</h3>
        <DataTable columns={columns} data={tenants} searchable />
      </div>

      {scorecards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award size={16} /> Driver Scorecards</h3>
          <DataTable columns={scorecardColumns} data={scorecards} />
        </div>
      )}
    </div>
  );
}
