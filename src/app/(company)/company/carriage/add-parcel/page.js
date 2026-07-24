"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Plus, Truck } from "lucide-react";

export default function OpenCarriagePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [carriages, setCarriages] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [vehicleData, carriageData] = await Promise.all([
          api.get("/vehicles").catch(() => []),
          api.get("/carriages").catch(() => []),
        ]);
        setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
        setCarriages(Array.isArray(carriageData) ? carriageData : []);
      } catch (err) {
        setError(err.message || "Unable to load vehicles.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const availableVehicles = useMemo(() => {
    const activeVehicleIds = new Set(carriages.filter((carriage) => carriage.status !== "DELIVERED").map((carriage) => carriage.vehicleId));
    return vehicles.filter((vehicle) => vehicle.status === "ACTIVE" && !activeVehicleIds.has(vehicle.id));
  }, [carriages, vehicles]);

  const handleOpenCarriage = async () => {
    if (!selectedVehicleId) {
      setError("Pick a vehicle before opening a carriage.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/carriages", { vehicleId: selectedVehicleId });
      router.push("/company/carriage");
    } catch (err) {
      setError(err.message || "Unable to open carriage.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button onClick={() => router.push("/company/carriage")} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Carriage
        </button>
        <h1 className="text-xl font-bold text-gray-900">Open carriage</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a vehicle and open a carriage so ticket IDs can be added to it.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary">
          This step creates the carriage. Ticket IDs are added to the open carriage from the carriage screen.
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={16} /> Loading vehicles...
          </div>
        ) : availableVehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            <Truck className="mx-auto mb-2 text-gray-300" size={28} />
            No active vehicles are available right now.
          </div>
        ) : (
          <div className="space-y-3">
            {availableVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${selectedVehicleId === vehicle.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span>
                  <span className="block font-semibold text-gray-900">{vehicle.plateNumber || vehicle.plate || vehicle.id}</span>
                  <span className="block text-xs text-gray-500">{vehicle.makeModel || vehicle.type || "Vehicle"}</span>
                </span>
                {selectedVehicleId === vehicle.id ? <span className="text-xs font-semibold text-primary">Selected</span> : <span className="text-xs text-gray-400">Choose</span>}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleOpenCarriage} disabled={submitting || availableVehicles.length === 0 || !selectedVehicleId}>
            {submitting ? <><Loader2 className="mr-1 animate-spin" size={14} /> Opening...</> : <><Plus size={14} className="mr-1" /> Open carriage</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
