"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Package, Search, Clock, MapPin } from "lucide-react";

const STEPS = ["Shipped", "In Transit", "Delivered"];

function statusToStep(status) {
  switch (status) {
    case "PENDING_ASSIGNMENT":
    case "ASSIGNED":
      return 0;
    case "IN_TRANSIT":
    case "ARRIVED":
      return 1;
    case "DELIVERED":
    case "CLOSED":
      return 2;
    default:
      return 0;
  }
}

function formatMoney(amount) {
  return `NGN ${Number(amount || 0).toLocaleString()}`;
}

function formatSize(size) {
  if (!size) return "—";
  const values = [size.width, size.length, size.height].map((v) => (v ? Number(v).toLocaleString() : "-"));
  return values.every((v) => v === "-") ? "—" : values.join(" x ");
}

export default function TrackingPage() {
  const [code, setCode] = useState("");
  const [tracking, setTracking] = useState(null);
  const [items, setItems] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setNotFound(false);
    setError(null);
    setTracking(null);
    setItems([]);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const ticketRes = await fetch(`${base}/public/tracking/${encodeURIComponent(trimmed)}`);
      if (ticketRes.status === 404) {
        setNotFound(true);
        return;
      }
      if (!ticketRes.ok) throw new Error("Failed to fetch tracking data");
      const ticketData = await ticketRes.json();
      setTracking({ ...ticketData, currentStep: statusToStep(ticketData.status) });

      if (ticketData.id) {
        try {
          const itemsRes = await fetch(`${base}/items/ticket/${ticketData.id}`);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            setItems(Array.isArray(itemsData) ? itemsData : []);
          }
        } catch {
          // items fetch failed, ignore
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Image src="/logo.svg" alt="DLM" width={72} height={72} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Track Your Shipment</h1>
          <p className="text-sm text-gray-500 mt-2">Enter your tracking code to see delivery status</p>
        </div>

        <form onSubmit={handleTrack} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ticket or Item number (e.g. TCK-20260703-0014)"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Tracking..." : "Track Shipment"}
          </Button>
        </form>

        {loading && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Fetching tracking data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 bg-red-50 rounded-xl border border-red-200 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {notFound && !loading && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">No tracking data found for <strong>{code.trim()}</strong></p>
            <p className="text-xs text-gray-400 mt-1">Please check your code and try again.</p>
          </div>
        )}

        {tracking && !loading && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{tracking.ticketNumber}</p>
              <StatusBadge status={tracking.status} />
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
                <div className="absolute top-3 left-0 h-0.5 bg-primary transition-all duration-500" style={{ width: `${(tracking.currentStep / (STEPS.length - 1)) * 100}%` }} />
                {STEPS.map((step, i) => (
                  <div key={step} className="relative flex flex-col items-center z-10" style={{ width: `${100 / STEPS.length}%` }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${i <= tracking.currentStep ? "bg-primary border-primary text-white" : "bg-white border-gray-300 text-gray-400"}`}>
                      {i <= tracking.currentStep ? "✓" : i + 1}
                    </div>
                    <p className={`text-[10px] mt-2 text-center whitespace-nowrap ${i <= tracking.currentStep ? "text-primary font-medium" : "text-gray-400"}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"><MapPin size={16} className="text-orange-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Route</p>
                  <p className="font-medium">{tracking.originAddress || "—"} → {tracking.destinationAddress || "—"}</p>
                </div>
              </div>
              {tracking.cargoDescription && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><Package size={16} className="text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Cargo</p>
                    <p className="font-medium">{tracking.cargoDescription}</p>
                  </div>
                </div>
              )}
              {tracking.lastUpdatedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><Clock size={16} className="text-green-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(tracking.lastUpdatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={16} /> Items ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.pictureUrl ? (
                          <img src={item.pictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.weight} kg — {formatMoney(item.amount)}</p>
                        {item.size && <p className="text-xs text-gray-400">Size: {formatSize(item.size)}</p>}
                        {item.itemNumber && <p className="text-xs text-primary font-mono mt-1">{item.itemNumber}</p>}
                        {item.senderName && <p className="text-xs text-gray-400">From: {item.senderName} {item.senderPhone ? `(${item.senderPhone})` : ""}</p>}
                        {item.receiverName && <p className="text-xs text-gray-400">To: {item.receiverName} {item.receiverPhone ? `(${item.receiverPhone})` : ""}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tracking.consignee && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Consignee</h3>
                <div className="text-sm text-gray-600">
                  <p>{tracking.consignee.name}</p>
                  <p className="text-xs text-gray-400">{tracking.consignee.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!tracking && !notFound && !loading && !error && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Enter the tracking code provided on your receipt or by the sender.</p>
            <p className="text-[10px] text-gray-300 mt-4">Sponsored by Zarox IT Solution</p>
          </div>
        )}
      </div>
    </div>
  );
}
