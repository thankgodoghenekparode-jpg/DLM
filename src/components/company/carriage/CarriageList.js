"use client";

import { ArrowRight, Loader2, PackagePlus, Truck } from "lucide-react";
import Button from "@/components/shared/Button";

export default function CarriageList({ carriages, vehicleMap, busyId, onAddParcel, onStatusChange }) {
  if (carriages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
        <Truck className="mx-auto text-gray-300" size={34} />
        <p className="mt-3 text-sm font-semibold text-gray-800">No carriages in this stage</p>
        <p className="mt-1 text-xs text-gray-500">Carriages will appear here as they move through operations.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Origin</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">No. of parcels</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {carriages.map((carriage) => (
              <tr key={carriage.id} className="text-sm text-gray-700 hover:bg-gray-50/70">
                <td className="max-w-48 px-4 py-4 font-medium text-gray-900">{carriage.originAddress || "Set by first parcel"}</td>
                <td className="max-w-48 px-4 py-4">{carriage.destinationAddress || "Set by first parcel"}</td>
                <td className="px-4 py-4"><Vehicle vehicle={vehicleMap[carriage.vehicleId]} /></td>
                <td className="px-4 py-4 font-medium">{carriage.ticketIds?.length || 0}</td>
                <td className="px-4 py-4"><Actions carriage={carriage} busy={busyId === carriage.id} onAddParcel={onAddParcel} onStatusChange={onStatusChange} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {carriages.map((carriage) => (
          <article key={carriage.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <Vehicle vehicle={vehicleMap[carriage.vehicleId]} />
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{carriage.ticketIds?.length || 0} parcels</span>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-gray-50 p-3">
              <RoutePoint label="Origin" address={carriage.originAddress || "Set by first parcel"} />
              <ArrowRight className="text-gray-300" size={16} />
              <RoutePoint label="Destination" address={carriage.destinationAddress || "Set by first parcel"} />
            </div>
            <div className="mt-4"><Actions carriage={carriage} busy={busyId === carriage.id} onAddParcel={onAddParcel} onStatusChange={onStatusChange} /></div>
          </article>
        ))}
      </div>
    </>
  );
}

function Vehicle({ vehicle }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Truck size={17} /></span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">{vehicle?.plateNumber || "Unknown vehicle"}</span>
        <span className="block text-xs text-gray-500">{vehicle?.makeModel || vehicle?.type || "—"}</span>
      </span>
    </div>
  );
}

function RoutePoint({ label, address }) {
  return <div className="min-w-0"><p className="text-[10px] font-medium uppercase text-gray-400">{label}</p><p className="mt-0.5 truncate text-xs font-medium text-gray-700">{address}</p></div>;
}

function Actions({ carriage, busy, onAddParcel, onStatusChange }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {carriage.status === "OPEN" && (
        <>
          <Button size="sm" variant="secondary" onClick={() => onAddParcel(carriage)} disabled={busy}>
            <PackagePlus className="mr-1.5" size={14} /> Add parcel
          </Button>
          <Button size="sm" onClick={() => onStatusChange(carriage, "IN_TRANSIT")} disabled={busy || !carriage.ticketIds?.length}>
            {busy ? <Loader2 className="animate-spin" size={14} /> : "Start transit"}
          </Button>
        </>
      )}
      {carriage.status === "IN_TRANSIT" && (
        <Button size="sm" onClick={() => onStatusChange(carriage, "DELIVERED")} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={14} /> : "Mark delivered"}
        </Button>
      )}
      {carriage.status === "DELIVERED" && <span className="text-xs font-medium text-green-700">Completed</span>}
    </div>
  );
}
