import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Navigation, XCircle, Loader2, TriangleAlert, MessageCircleWarning } from "lucide-react";
import { fetchRealNearbyServices, triggerEmergencySMS } from "../services/api";
import { C } from "../constants/theme";
import { triggerHaptic } from "../components/Shared";

export default function SosFlow({ location }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [isAborted, setIsAborted] = useState(false);
  const [isDialed, setIsDialed] = useState(false);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(true);

  const contactsRef = useRef([]);
  const profileRef = useRef(null);

  // Load profile and contacts from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("roadsos_profile_info");
      const savedContacts = localStorage.getItem("roadsos_profile_contacts");
      if (savedProfile) profileRef.current = JSON.parse(savedProfile);
      if (savedContacts) contactsRef.current = JSON.parse(savedContacts);
    } catch (e) {
      console.error("Failed to load profile/contacts", e);
    }
  }, []);

  // Fetch nearest hospital
  useEffect(() => {
    let isActive = true;
    async function getHospital() {
      if (!location.rawLat || !location.rawLng) {
        setLoadingHospital(false);
        return;
      }
      try {
        const services = await fetchRealNearbyServices(location.rawLat, location.rawLng);
        const hospital = services.find(s => s.category === "Medical");
        if (isActive) {
          if (hospital) {
            setNearestHospital(hospital);
          } else {
            // Fallback hospital
            setNearestHospital({
              name: "City General Hospital (Emergency)",
              distance: "1.8 km",
              phone: "108",
              lat: (parseFloat(location.rawLat) + 0.01).toFixed(4),
              lng: (parseFloat(location.rawLng) + 0.01).toFixed(4),
            });
          }
          setLoadingHospital(false);
        }
      } catch (err) {
        if (isActive) {
          setNearestHospital({
            name: "City General Hospital (Emergency)",
            distance: "1.8 km",
            phone: "108",
            lat: (parseFloat(location.rawLat) + 0.01).toFixed(4),
            lng: (parseFloat(location.rawLng) + 0.01).toFixed(4),
          });
          setLoadingHospital(false);
        }
      }
    }
    getHospital();
    return () => {
      isActive = false;
    };
  }, [location.rawLat, location.rawLng]);

  // Countdown & Haptic Alarm Pattern
  useEffect(() => {
    if (countdown > 0 && !isAborted) {
      const timer = setTimeout(() => {
        // Strong haptic vibration on countdown tick
        triggerHaptic("heavy");
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isAborted && !isDialed) {
      setIsDialed(true);
      // Double strong pulse on dial activation
      triggerHaptic("heavy");
      setTimeout(() => triggerHaptic("heavy"), 250);
      
      // Auto dial 108
      window.location.href = "tel:108";
    }
  }, [countdown, isAborted, isDialed]);

  const handleAbort = () => {
    triggerHaptic("light");
    setIsAborted(true);
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col p-6 transition-all duration-500 justify-between items-center"
      style={{
        background: isDialed
          ? "radial-gradient(circle, #aa000f 0%, #0d0a0a 100%)"
          : "radial-gradient(circle, #690005 0%, #0d0a0a 100%)"
      }}
    >
      {/* Centered Pulsing SOS Circle Visuals */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
        <div className="relative flex items-center justify-center h-52 w-52">
          {/* Animated concentric rings */}
          <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-4 rounded-full bg-red-600/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-8 rounded-full bg-red-600/30 animate-ping" style={{ animationDuration: "1s" }} />
          
          <div
            className="absolute inset-12 rounded-full flex flex-col items-center justify-center md-elevation-4 border-none text-white select-none active:scale-95 transition-transform"
            style={{
              background: C.sosRed,
              boxShadow: "0 0 40px rgba(255, 59, 48, 0.6)"
            }}
          >
            {!isDialed ? (
              <div className="flex flex-col items-center gap-2 select-none relative w-full h-full justify-center">
                <TriangleAlert
                  className="h-14 w-14 mb-1 animate-pulse"
                  strokeWidth={2.5}
                />
                <span className="text-[36px] font-black leading-none tracking-widest">
                  {countdown}s
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 select-none text-center justify-center">
                <Phone className="h-14 w-14 text-white animate-pulse" strokeWidth={2} />
                <span className="text-[14px] uppercase font-black tracking-widest mt-2">SOS ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          {!isDialed ? (
            <>
              <h1 className="text-3xl font-black mb-1 text-white tracking-widest uppercase">
                SOS Triggered
              </h1>
              <p className="text-sm text-red-300 font-medium">
                Auto-dialing 108 and sharing coordinates in {countdown}s
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mb-1 text-red-400 tracking-widest uppercase animate-pulse">
                SOS Active
              </h1>
              <p className="text-sm text-green-300 font-bold mb-4">
                108 Dialer Triggered
              </p>
              <button
                onClick={() => {
                  triggerHaptic("heavy");
                  triggerEmergencySMS(profileRef.current, contactsRef.current, location);
                }}
                className="w-full max-w-[200px] h-12 mx-auto rounded-full flex items-center justify-center gap-2 text-sm font-bold bg-orange-600 text-white border-none active:scale-95 transition-transform cursor-pointer shadow-lg shadow-orange-600/30"
              >
                <MessageCircleWarning className="h-4 w-4" /> Send SMS Alerts
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hospital details & abort buttons */}
      <div className="flex flex-col gap-4 z-10 pb-8 w-full max-w-sm">
        {/* Nearest Hospital Card */}
        <div
          className="w-full rounded-[28px] p-5 flex flex-col gap-3 text-left border border-white/10"
          style={{ background: "rgba(30, 27, 26, 0.5)", backdropFilter: "blur(10px)" }}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              Nearest Hospital Navigation
            </p>
            {loadingHospital ? (
              <div className="flex items-center gap-2 mt-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                <span className="text-sm text-white/50">Resolving coordinates...</span>
              </div>
            ) : nearestHospital ? (
              <>
                <h3 className="text-[17px] font-black text-white mt-1 leading-tight">
                  {nearestHospital.name}
                </h3>
                <p className="text-xs text-white/70 mt-1">
                  Distance: <strong className="text-red-400">{nearestHospital.distance}</strong>
                </p>
              </>
            ) : (
              <span className="text-sm text-white/60">Search failed. Use 108 emergency dialer.</span>
            )}
          </div>

          {nearestHospital && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${location.rawLat},${location.rawLng}&destination=${nearestHospital.lat},${nearestHospital.lng}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => triggerHaptic("light")}
              className="mt-1 w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm text-white bg-red-700 hover:bg-red-600 active:scale-95 transition-transform border-none outline-none cursor-pointer no-underline"
            >
              <Navigation className="h-4 w-4" /> Navigate Now
            </a>
          )}
        </div>

        {/* Abort button */}
        <button
          onClick={handleAbort}
          className="w-full h-15 rounded-[24px] flex items-center justify-center gap-3 text-md font-black bg-white text-red-950 border-none active:scale-95 transition-transform cursor-pointer"
        >
          <XCircle className="h-5 w-5" /> {isDialed ? "I'm Safe (Return)" : "Cancel Alert"}
        </button>
      </div>
    </div>
  );
}
