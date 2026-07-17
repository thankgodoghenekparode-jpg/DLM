"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });

function DraggableMarker({ position, onDragEnd }) {
  const [pos, setPos] = useState(position);
  const markerRef = useRef(null);

  useEffect(() => { setPos(position); }, [position]);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (!marker) return;
      const latlng = marker.getLatLng();
      onDragEnd({ latitude: latlng.lat, longitude: latlng.lng });
    },
  };

  return <Marker position={pos} draggable={true} eventHandlers={eventHandlers} ref={markerRef} />;
}

const FlyTo = dynamic(() => import("react-leaflet").then((m) => {
  function FlyToComponent({ position }) {
    const map = m.useMap();
    const mapRef = useRef(map);
    mapRef.current = map;
    useEffect(() => {
      if (position && mapRef.current) {
        mapRef.current.flyTo(position, 15, { duration: 1 });
      }
    }, [position]);
    return null;
  }
  return FlyToComponent;
}), { ssr: false });

const MapEvents = dynamic(() => import("react-leaflet").then((m) => {
  function MapEventsComponent({ onClick }) {
    const map = m.useMap();
    const cbRef = useRef(onClick);
    cbRef.current = onClick;
    useEffect(() => {
      function handleClick(e) {
        if (cbRef.current) cbRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
      map.on("click", handleClick);
      return () => map.off("click", handleClick);
    }, [map]);
    return null;
  }
  return MapEventsComponent;
}), { ssr: false });

const DEFAULT_CENTER = [6.5244, 3.3792];
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function AddressMapPicker({
  address: controlledAddress,
  latitude: controlledLat,
  longitude: controlledLng,
  onChange,
  required = false,
  className = "",
}) {
  const [address, setAddress] = useState(controlledAddress || "");
  const [lat, setLat] = useState(controlledLat || DEFAULT_CENTER[0]);
  const [lng, setLng] = useState(controlledLng || DEFAULT_CENTER[1]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => { if (controlledAddress !== undefined) setAddress(controlledAddress); }, [controlledAddress]);
  useEffect(() => { if (controlledLat !== undefined) setLat(controlledLat); }, [controlledLat]);
  useEffect(() => { if (controlledLng !== undefined) setLng(controlledLng); }, [controlledLng]);

  const emitChange = useCallback((next) => { if (onChange) onChange(next); }, [onChange]);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (results.length === 0) { setSearchError("No results found"); setSearching(false); return; }
      const first = results[0];
      const newLat = parseFloat(first.lat);
      const newLng = parseFloat(first.lon);
      setLat(newLat);
      setLng(newLng);
      setAddress(first.display_name || address);
      emitChange({ address: first.display_name || address, latitude: newLat, longitude: newLng });
    } catch { setSearchError("Search failed"); } finally { setSearching(false); }
  };

  const handleAddressInput = (e) => {
    const val = e.target.value;
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { emitChange({ address: val, latitude: lat, longitude: lng }); }, 500);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } };

  const handleMarkerDrag = ({ latitude: newLat, longitude: newLng }) => {
    setLat(newLat);
    setLng(newLng);
    emitChange({ address, latitude: newLat, longitude: newLng });
  };

  const handleMapClick = useCallback(
    ({ latitude: newLat, longitude: newLng }) => { setLat(newLat); setLng(newLng); emitChange({ address, latitude: newLat, longitude: newLng }); },
    [address, emitChange]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={address} onChange={handleAddressInput} onKeyDown={handleKeyDown}
            placeholder="Search address..." required={required}
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>
        <button type="button" onClick={handleSearch} disabled={searching}
          className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1">
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
        </button>
      </div>
      {searchError && <p className="text-xs text-red-600">{searchError}</p>}

      <div className="h-48 rounded-lg overflow-hidden border border-gray-200 relative z-0">
        <MapContainer center={[lat, lng]} zoom={lat === DEFAULT_CENTER[0] && lng === DEFAULT_CENTER[1] ? 6 : 15}
          style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
          <DraggableMarker position={[lat, lng]} onDragEnd={handleMarkerDrag} />
          <FlyTo position={[lat, lng]} />
          <MapEvents onClick={handleMapClick} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Latitude</label>
          <input type="number" step="any" value={lat}
            onChange={(e) => { const v = parseFloat(e.target.value) || 0; setLat(v); emitChange({ address, latitude: v, longitude: lng }); }}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Longitude</label>
          <input type="number" step="any" value={lng}
            onChange={(e) => { const v = parseFloat(e.target.value) || 0; setLng(v); emitChange({ address, latitude: lat, longitude: v }); }}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
        </div>
      </div>
    </div>
  );
}
