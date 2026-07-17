"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Package, Search, Navigation, Flag, Clock, MapPin } from "lucide-react";

const STEPS = ["Shipped", "In Transit", "Out for Delivery", "Delivered"];

function statusToStep(status) {
  switch (status) {
    case "PENDING_ASSIGNMENT":
    case "ASSIGNED":
      return 0;
    case "IN_TRANSIT":
      return 1;
    case "OUT_FOR_DELIVERY":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return 0;
  }
}

export default function TrackingPage() {
  const [code, setCode] = useState("");
  const [tracking, setTracking] = useState(null);
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

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${base}/public/tracking/${encodeURIComponent(trimmed)}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch tracking data");
      const data = await res.json();
      setTracking({ ...data, currentStep: statusToStep(data.status) });
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
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-white" />
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
              placeholder="e.g. TCK-20260703-0014"
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

            {/* Line Tracker */}
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
                  <p className="text-xs text-gray-500">Last Known Location</p>
                  <p className="font-medium">
                    {tracking.currentLocation
                      ? `${tracking.currentLocation.latitude}, ${tracking.currentLocation.longitude}`
                      : "Location unavailable"}
                  </p>
                </div>
              </div>
            </div>

            {tracking.lastUpdatedAt && (
              <div className="bg-primary-bg border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Estimated Arrival</p>
                <p className="text-lg font-bold text-primary flex items-center justify-center gap-2">
                  <Clock size={16} /> {new Date(tracking.lastUpdatedAt).toLocaleString()}
                </p>
              </div>
            )}

            {!tracking.lastUpdatedAt && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Estimated Arrival</p>
                <p className="text-sm text-gray-400">Not yet available</p>
              </div>
            )}
          </div>
        )}

        {!tracking && !notFound && !loading && !error && (
          <p className="text-xs text-gray-400 text-center mt-6">Enter the tracking code provided on your receipt or by the sender.</p>
        )}
      </div>
    </div>
  );
}
