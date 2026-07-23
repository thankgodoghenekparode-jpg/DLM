"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Truck } from "lucide-react";
import Button from "@/components/shared/Button";
import AddParcelModal from "@/components/company/carriage/AddParcelModal";
import CarriageList from "@/components/company/carriage/CarriageList";
import OpenCarriageModal from "@/components/company/carriage/OpenCarriageModal";
import { api } from "@/lib/api";

const TABS = [
  { id: "OPEN", label: "Opened carriages" },
  { id: "IN_TRANSIT", label: "In transit" },
  { id: "DELIVERED", label: "Delivered" },
];

function list(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

export default function CarriagePage() {
  const [activeTab, setActiveTab] = useState("OPEN");
  const [carriages, setCarriages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [parcelCarriage, setParcelCarriage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [carriageData, vehicleData, ticketData] = await Promise.all([
        api.get("/carriages"),
        api.get("/vehicles"),
        api.get("/tickets"),
      ]);
      setCarriages(list(carriageData));
      setVehicles(list(vehicleData));
      setTickets(list(ticketData));
    } catch (err) {
      setError(err.message || "Unable to load carriage operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const vehicleMap = useMemo(
    () => Object.fromEntries(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  );
  const activeVehicleIds = useMemo(
    () => new Set(carriages.filter((carriage) => carriage.status !== "DELIVERED").map((carriage) => carriage.vehicleId)),
    [carriages],
  );
  const loadedTicketIds = useMemo(
    () => new Set(carriages.flatMap((carriage) => carriage.ticketIds || [])),
    [carriages],
  );
  const visibleCarriages = carriages.filter((carriage) => carriage.status === activeTab);

  const openCarriage = async (payload) => {
    const created = await api.post("/carriages", payload);
    setCarriages((current) => [created, ...current]);
    setShowOpenModal(false);
    setActiveTab("OPEN");
  };

  const addParcel = async (ticket) => {
    const updated = await api.post(`/carriages/${parcelCarriage.id}/parcels`, { ticketId: ticket.id });
    setCarriages((current) => current.map((carriage) => carriage.id === updated.id ? updated : carriage));
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, vehicleId: updated.vehicleId } : item));
    setParcelCarriage(updated);
  };

  const changeStatus = async (carriage, status) => {
    setBusyId(carriage.id);
    setError("");
    try {
      const updated = await api.patch(`/carriages/${carriage.id}/status`, { status });
      setCarriages((current) => current.map((item) => item.id === updated.id ? updated : item));
      setVehicles((current) => current.map((vehicle) =>
        vehicle.id === updated.vehicleId
          ? { ...vehicle, status: status === "IN_TRANSIT" ? "ON_TRANSIT" : "ACTIVE" }
          : vehicle
      ));
      setActiveTab(status);
    } catch (err) {
      setError(err.message || "Unable to update carriage status.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carriage</h1>
          <p className="mt-1 text-sm text-gray-500">Open vehicle loads, add parcels, and move each carriage through delivery.</p>
        </div>
        <Button onClick={() => setShowOpenModal(true)}><Plus className="mr-1.5" size={16} /> Open carriage</Button>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 font-medium hover:underline"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200" aria-label="Carriage status">
        {TABS.map((tab) => {
          const count = carriages.filter((carriage) => carriage.status === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {tab.label} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-primary/10" : "bg-gray-100"}`}>{count}</span>
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-gray-400">
          <Truck className="mr-2" size={20} /><span className="text-sm">Loading carriages...</span>
        </div>
      ) : (
        <CarriageList carriages={visibleCarriages} vehicleMap={vehicleMap} busyId={busyId} onAddParcel={setParcelCarriage} onStatusChange={changeStatus} />
      )}

      {showOpenModal && (
        <OpenCarriageModal vehicles={vehicles} activeVehicleIds={activeVehicleIds} onClose={() => setShowOpenModal(false)} onSubmit={openCarriage} />
      )}
      {parcelCarriage && (
        <AddParcelModal carriage={parcelCarriage} tickets={tickets} loadedTicketIds={loadedTicketIds} onClose={() => setParcelCarriage(null)} onAdd={addParcel} />
      )}
    </div>
  );
}
