import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Navigation, Loader2 } from "lucide-react";
import { PageHeader, triggerHaptic } from "../components/Shared";
import { fetchRealNearbyServices } from "../services/api";
import { C } from "../constants/theme";

export default function NearbyHelp({ location }) {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    async function loadPlaces() {
      if (location.rawLat && location.rawLng) {
        setLoading(true);
        try {
          const data = await fetchRealNearbyServices(
            location.rawLat,
            location.rawLng,
            5000,
            abortController.signal,
          );
          if (isActive) {
            setPlaces(data);
            setLoading(false);
          }
        } catch (error) {
          if (isActive && error.name !== "AbortError") {
            setPlaces([]);
            setLoading(false);
          }
        }
      }
    }
    loadPlaces();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [location.rawLat, location.rawLng]);

  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{ background: C.bg }}
    >
      <PageHeader title="Nearby Help" />

      <div className="flex flex-col gap-4 overflow-y-auto pb-6 z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-10 text-[#d0c4b5]">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#ffb4ab]" />
            <p>Scanning real-world services nearby...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center text-[#d0c4b5] mt-10">
            No verified services found nearby. Please use the SOS emergency
            dialer.
          </div>
        ) : (
          places.map((place) => (
            <div
              key={place.id}
              className="w-full rounded-[24px] p-4 flex flex-col gap-4"
              style={{ background: C.surfaceContainer }}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: place.color, color: place.onColor }}
                  >
                    <place.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3
                      className="text-[16px] font-bold pr-2 leading-tight"
                      style={{ color: C.onSurface }}
                    >
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: C.onSurfaceVariant }}
                      >
                        {place.category}
                      </span>
                      <span className="text-[12px] opacity-50 text-white">
                        •
                      </span>
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: C.primary }}
                      >
                        {place.distance}
                      </span>
                    </div>
                    {place.phone && place.phone !== "N/A" && (
                      <div className="text-[13px] mt-1.5 font-mono text-[#d0c4b5] flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 opacity-70 text-[#ffb4ab]" />
                        <span>{place.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <a
                  href={place.phone !== "N/A" ? `tel:${place.phone}` : "#"}
                  onClick={(e) => {
                    if (place.phone === "N/A") e.preventDefault();
                    triggerHaptic("heavy");
                  }}
                  className={`rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-[15px] no-underline hover:brightness-110 active:scale-95 transition-all shadow-lg ${place.phone !== "N/A" ? "bg-green-600 text-white animate-pulse shadow-green-900/50" : "bg-[#363431] text-gray-500 cursor-not-allowed"}`}
                >
                  <Phone className="h-5 w-5" />{" "}
                  {place.phone !== "N/A" ? `Call ${place.phone}` : "Unavailable"}
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${location.rawLat},${location.rawLng}&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => triggerHaptic("light")}
                  className="rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-[15px] border-none outline-none no-underline hover:brightness-110 active:scale-95 transition-all shadow-lg"
                  style={{
                    background: C.primaryContainer,
                    color: C.onPrimaryContainer,
                  }}
                >
                  <Navigation className="h-5 w-5" /> Direct
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
