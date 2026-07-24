"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/shared/DataTable";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";

const columns = [
  {
    header: "Carriage ID",
    accessor: "id",
    sortable: true,
    searchValue: (row) => `${row.id} ${row._ticketNumbers.join(" ")} ${row._ticketIds.join(" ")}`,
    render: (row) => (
      <button type="button" onClick={(event) => event.stopPropagation()} className="font-medium text-primary hover:underline">
        {row.id}
      </button>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Vehicle",
    accessor: "_vehiclePlate",
    sortable: true,
    render: (row) => row._vehiclePlate || "-",
  },
  {
    header: "Items",
    accessor: "_ticketCount",
    sortable: true,
    render: (row) => row._ticketCount || 0,
  },
  {
    header: "Route",
    accessor: "_route",
    sortable: true,
    render: (row) => row._route || "-",
  },
  {
    header: "Updated",
    accessor: "updatedAt",
    sortable: true,
    render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-",
  },
];

export default function TicketsPage() {
  const [carriages, setCarriages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCarriageId, setSelectedCarriageId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [carriageData, ticketData, vehicleData] = await Promise.all([
          api.get("/carriages").catch(() => []),
          api.get("/tickets").catch(() => []),
          api.get("/vehicles").catch(() => []),
        ]);
        setCarriages(Array.isArray(carriageData) ? carriageData : []);
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      } catch (err) {
        setError(err.message || "Unable to load carriage history.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);

  const carriageRows = useMemo(() => {
    const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    return carriages.map((carriage) => {
      const carriageTickets = (carriage.ticketIds || [])
        .map((ticketId) => ticketMap.get(ticketId))
        .filter(Boolean);
      const firstTicket = carriageTickets[0];
      const route = `${carriage.originAddress || firstTicket?.originAddress || "-"} -> ${carriage.destinationAddress || firstTicket?.destinationAddress || "-"}`;
      const vehicle = vehicleMap[carriage.vehicleId];

      return {
        ...carriage,
        _ticketCount: carriageTickets.length,
        _ticketIds: carriageTickets.map((ticket) => ticket.id),
        _ticketNumbers: carriageTickets.map((ticket) => ticket.ticketNumber).filter(Boolean),
        _ticketDetails: carriageTickets,
        _route: route,
        _vehiclePlate: vehicle?.plateNumber || vehicle?.plate || vehicle?.id || "-",
        _searchText: [carriage.id, carriage.status, ...carriageTickets.map((ticket) => ticket.ticketNumber), ...carriageTickets.map((ticket) => ticket.id)].join(" ").toLowerCase(),
      };
    });
  }, [carriages, tickets, vehicleMap]);

  useEffect(() => {
    if (!selectedCarriageId && carriageRows.length > 0) {
      setSelectedCarriageId(carriageRows[0].id);
    }
  }, [carriageRows, selectedCarriageId]);

  const selectedCarriage = carriageRows.find((row) => row.id === selectedCarriageId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="secondary" className="mt-3" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carriage history</h1>
          <p className="mt-1 text-sm text-gray-500">Search carriage IDs or ticket numbers to review opened, in-transit, and delivered loads.</p>
        </div>
        <Link href="/company/carriage">
          <Button><Plus size={16} className="mr-1" /> Open carriage</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Carriages</h2>
          <p className="mt-1 text-xs text-gray-500">Click any row to view the ticket IDs stored under that carriage.</p>
        </div>
        <div className="p-5">
          <DataTable
            columns={columns}
            data={carriageRows}
            searchable
            searchPlaceholder="Search carriage ID or ticket number"
            getSearchValue={(row) => row._searchText}
            onRowClick={(row) => setSelectedCarriageId(row.id)}
          />
        </div>
      </div>

      {selectedCarriage && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Items in {selectedCarriage.id}</h2>
              <p className="mt-1 text-sm text-gray-500">{selectedCarriage._ticketCount || 0} ticket{selectedCarriage._ticketCount === 1 ? "" : "s"} linked to this carriage.</p>
            </div>
            <StatusBadge status={selectedCarriage.status} />
          </div>

          {selectedCarriage._ticketDetails.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No ticket IDs have been added to this carriage yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {selectedCarriage._ticketDetails.map((ticket) => (
                <Link key={ticket.id} href={`/company/tickets/${ticket.id}`} className="rounded-lg border border-gray-200 p-3 transition hover:border-primary hover:bg-primary/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{ticket.ticketNumber || ticket.id}</p>
                    <StatusBadge status={ticket.status} className="text-[11px]" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{ticket.originAddress || "-"} → {ticket.destinationAddress || "-"}</p>
                  <p className="mt-1 text-[11px] font-mono text-primary">{ticket.id}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
