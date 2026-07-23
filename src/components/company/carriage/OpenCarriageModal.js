"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Truck, X } from "lucide-react";
import Button from "@/components/shared/Button";

export default function OpenCarriageModal({ vehicles, activeVehicleIds, onClose, onSubmit }) {
  const [vehicleId, setVehicleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "ACTIVE" && !activeVehicleIds.has(vehicle.id)),
    [activeVehicleIds, vehicles],
  );

  const submit = async () => {
    if (!vehicleId) {
      setError("Select a vehicle to continue.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ vehicleId });
    } catch (err) {
      setError(err.message || "Unable to open this carriage.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Open a carriage</h2>
            <p className="mt-1 text-sm text-gray-500">Choose an available vehicle. The first parcel added will set its route.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Available vehicles</h3>
              <span className="text-xs text-gray-500">{availableVehicles.length} available</span>
            </div>
            {availableVehicles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <Truck className="mx-auto text-gray-300" size={28} />
                <p className="mt-2 text-sm font-medium text-gray-700">No vehicles are available</p>
                <p className="mt-1 text-xs text-gray-500">Only active vehicles without another open or in-transit carriage can be selected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {availableVehicles.map((vehicle) => {
                  const selected = vehicleId === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setVehicleId(vehicle.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                        {selected ? <Check size={18} /> : <Truck size={18} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900">{vehicle.plateNumber}</span>
                        <span className="block truncate text-xs text-gray-500">{vehicle.makeModel || vehicle.type}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || availableVehicles.length === 0}>
            {submitting ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Truck className="mr-2" size={15} />}
            {submitting ? "Opening..." : "Open carriage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
