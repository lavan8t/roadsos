import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Navigation, Loader2, Hospital, ShieldAlert, Wrench, CircleDot, Fuel, MapPin, ArrowLeft, X } from "lucide-react";
import { triggerHaptic } from "../components/Shared";
import { fetchRealNearbyServices } from "../services/api";
import { C } from "../constants/theme";

const CATEGORIES = [
  { id: "Medical", name: "Hospitals", icon: Hospital, color: C.greenContainer, onColor: C.onGreenContainer },
  { id: "Police", name: "Police", icon: ShieldAlert, color: C.blueContainer, onColor: C.onBlueContainer },
  { id: "Mechanic", name: "Mechanics", icon: Wrench, color: "#b45309", onColor: "#ffffff" },
  { id: "Puncture Shop", name: "Puncture", icon: CircleDot, color: "#d97706", onColor: "#ffffff" },
  { id: "Fuel Station", name: "Fuel", icon: Fuel, color: "#be123c", onColor: "#ffffff" },
  { id: "Nearby City", name: "Cities", icon: MapPin, color: "#6b21a8", onColor: "#ffffff" },
];

export default function NearbyHelp({ location, onClose }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryClick = async (categoryId) => {
    triggerHaptic("light");
    setSelectedCategory(categoryId);
    setLoading(true);
    
    try {
      // Pull targeted localized data (from cache if offline, or strict query if online)
      const data = await fetchRealNearbyServices(location.rawLat, location.rawLng, 15000, categoryId); 
      setPlaces(data);
    } catch (e) {
      setPlaces([]);
    }
    setLoading(false);
  };

  const handleBack = () => {
    triggerHaptic("light");
    setSelectedCategory(null);
    setPlaces([]);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col p-6 rounded-t-[32px] animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ background: C.bg, height: '65vh' }}
      >
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-6 shrink-0" />
        
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-white">Nearby Help</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border-none text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pb-6 z-10 flex-1">
        {!selectedCategory ? (
          <>
            <div className="mb-4 p-4 rounded-3xl flex items-center gap-3 border border-white/5 shadow-lg" style={{ background: C.surfaceContainerHigh }}>
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/50 font-bold uppercase tracking-wider mb-0.5">You are currently near</p>
                <h2 className="text-base font-bold text-white leading-tight truncate">{location.name || "Locating..."}</h2>
              </div>
            </div>
            
            <p className="text-sm text-[#d0c4b5] mb-2 font-medium">Select a service to instantly scan the area.</p>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border border-white/5 active:scale-95 transition-transform"
                  style={{ background: C.surfaceContainer }}
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ background: cat.color, color: cat.onColor }}
                  >
                    <cat.icon className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">{cat.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white bg-transparent border-none p-0 cursor-pointer w-max mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Categories
            </button>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center mt-10 text-[#d0c4b5]">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#ffb4ab]" />
                <p>Scanning offline cache & network...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="text-center text-[#d0c4b5] mt-10">
                No {selectedCategory} found nearby. Please try expanding your search or use SOS.
              </div>
            ) : (
              places.map((place) => (
                <div
                  key={place.id}
                  className="w-full rounded-[24px] p-4 flex flex-col gap-4 animate-slide-up"
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
                      className={`rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-[15px] no-underline hover:brightness-110 active:scale-95 transition-all shadow-lg ${place.phone !== "N/A" ? "bg-green-600 text-white shadow-green-900/50" : "bg-[#363431] text-gray-500 cursor-not-allowed"}`}
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
          </>
        )}
      </div>
    </div>
    </>
  );
}
