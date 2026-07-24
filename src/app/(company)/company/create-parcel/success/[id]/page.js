"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { CheckCircle2, Clipboard, Loader2, MapPin, Package, Plus, Ticket, Truck, UserRound } from "lucide-react";

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value || "-"}</p>
    </div>
  );
}

export default function ParcelCreatedPage({ params }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [ticketData, itemData] = await Promise.all([
        api.get(`/tickets/${id}`).catch((err) => {
          setError(err.message || "Failed to load generated ticket");
          return null;
        }),
        api.get(`/items/ticket/${id}`).catch(() => []),
      ]);

      setTicket(ticketData);
      setItems(Array.isArray(itemData) ? itemData : []);
      setLoading(false);
    };

    load();
  }, [id]);

  const copyTicketNumber = async () => {
    if (!ticket?.ticketNumber || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(ticket.ticketNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-red-600">{error || "Generated ticket was not found."}</p>
        <Link href="/company/carriage" className="inline-flex mt-4">
          <Button>Open Carriage</Button>
        </Link>
      </div>
    );
  }

  const firstItem = items[0];
  const trackingCode = ticket.publicTrackingCode || ticket.trackingCode;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Parcel Created</h1>
              <p className="text-sm text-gray-500 mt-1">The ticket number has been generated and the dispatch assignment is ready.</p>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase text-primary">Generated Ticket Number</p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-2xl font-bold text-gray-900 break-all">{ticket.ticketNumber || ticket.id}</p>
            <button onClick={copyTicketNumber} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Clipboard size={15} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Ticket size={16} /> Ticket Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail label="Origin" value={ticket.originAddress} />
            <Detail label="Destination" value={ticket.destinationAddress} />
            <Detail label="Dispatch Date" value={ticket.requestedPickupAt ? new Date(ticket.requestedPickupAt).toLocaleString() : "-"} />
            <Detail label="Priority" value={ticket.priority} />
            <Detail label="Vehicle" value={ticket.vehicleId} />
            <Detail label="Driver" value={ticket.driverId} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><MapPin size={16} /> Tracking</h2>
          {trackingCode ? (
            <>
              <Detail label="Tracking Code" value={trackingCode} />
              <Link href="/public/tracking">
                <Button variant="secondary" className="w-full">Open Tracking</Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">Tracking code will appear when the backend returns it for this ticket.</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package size={16} /> Parcel Item</h2>
          {firstItem ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Description" value={firstItem.description} />
              <Detail label="Weight" value={firstItem.weight ? `${firstItem.weight} kg` : "-"} />
              <Detail label="Length" value={firstItem.size?.length} />
              <Detail label="Breadth" value={firstItem.size?.width} />
              <Detail label="Height" value={firstItem.size?.height} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No item details were returned for this ticket.</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><UserRound size={16} /> Receiver</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail label="Name" value={ticket.consignee?.name || firstItem?.receiverName} />
            <Detail label="Phone" value={ticket.consignee?.phone || firstItem?.receiverPhone} />
            <Detail label="Email" value={ticket.consignee?.email || firstItem?.receiverEmail} />
            <Detail label="Address" value={ticket.consignee?.address || ticket.destinationAddress} />
          </div>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Link href="/company/carriage">
          <Button variant="secondary"><Plus size={16} className="mr-1" /> Open Another Carriage</Button>
        </Link>
        <Link href={`/company/tickets/${ticket.id}`}>
          <Button><Truck size={16} className="mr-1" /> View Full Ticket</Button>
        </Link>
      </div>
    </div>
  );
}


