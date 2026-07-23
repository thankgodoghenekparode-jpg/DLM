"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, Package, Plus, X } from "lucide-react";
import Button from "@/components/shared/Button";

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

export default function AddParcelModal({ carriage, tickets, loadedTicketIds, onClose, onAdd }) {
  const [addingId, setAddingId] = useState("");
  const [error, setError] = useState("");
  const available = useMemo(() => tickets.filter((ticket) =>
    ["DRAFT", "PENDING_ASSIGNMENT"].includes(ticket.status) &&
    !loadedTicketIds.has(ticket.id) &&
    (!carriage.originAddress || (
      normalize(ticket.originAddress) === normalize(carriage.originAddress) &&
      normalize(ticket.destinationAddress) === normalize(carriage.destinationAddress)
    ))
  ), [carriage, loadedTicketIds, tickets]);

  const add = async (ticket) => {
    setAddingId(ticket.id);
    setError("");
    try {
      await onAdd(ticket);
    } catch (err) {
      setError(err.message || "Unable to add this parcel.");
      setAddingId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add parcel</h2>
            <p className="mt-1 text-sm text-gray-500">{carriage.originAddress ? `${carriage.originAddress} → ${carriage.destinationAddress}` : "The first parcel will set this carriage’s route."}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="Close modal"><X size={20} /></button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {available.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-5 py-8 text-center">
              <Package className="mx-auto text-gray-300" size={30} />
              <p className="mt-2 text-sm font-medium text-gray-800">No matching parcels waiting</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">Create a parcel for this route, then return here to load it.</p>
              <Link href="/company/tickets/create" className="mt-4 inline-flex">
                <Button><Plus className="mr-1.5" size={15} /> Create parcel</Button>
              </Link>
            </div>
          ) : available.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{ticket.ticketNumber}</p>
                <p className="truncate text-xs text-gray-500">{ticket.cargoDescription || ticket.description || "Parcel"}</p>
              </div>
              <Button size="sm" onClick={() => add(ticket)} disabled={Boolean(addingId)}>
                {addingId === ticket.id ? <Loader2 className="animate-spin" size={15} /> : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
