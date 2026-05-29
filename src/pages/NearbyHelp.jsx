import React, { useState, useEffect } from "react";
import { Phone, Navigation, Check, Loader2 } from "lucide-react";
import { PageHeader } from "../components/Shared";
import { fetchRealNearbyServices } from "../services/api";
import { C } from "../constants/theme";

export default function NearbyHelp({ location }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlaces() {
      if (location.rawLat && location.rawLng) {
        setLoading(true);
        const data = await fetchRealNearbyServices(
          location.rawLat,
          location.rawLng,
        );
        setPlaces(data);
        setLoading(false);
      }
    }
    loadPlaces();
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
              className="w-full rounded-[24px] p-4 flex flex-col gap-4 md-elevation-1"
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <a
                  href={`tel:${place.phone}`}
                  className="rounded-xl py-2.5 flex items-center justify-center gap-2 font-bold text-[14px] bg-[#363431] text-[#eae0d4] no-underline"
                >
                  <Phone className="h-4 w-4" />{" "}
                  {place.phone !== "N/A" ? "Call" : "Unavailable"}
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl py-2.5 flex items-center justify-center gap-2 font-bold text-[14px] border-none outline-none no-underline"
                  style={{
                    background: C.primaryContainer,
                    color: C.onPrimaryContainer,
                  }}
                >
                  <Navigation className="h-4 w-4" /> Direct
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
