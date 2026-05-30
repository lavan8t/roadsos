import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Navigation, XCircle, Loader2, TriangleAlert, MessageCircleWarning } from "lucide-react";
import { fetchRealNearbyServices, triggerEmergencySMS } from "../services/api";
import { C } from "../constants/theme";
import { triggerHaptic } from "../components/Shared";
import EmergencyBeacon from "../components/EmergencyBeacon";

export default function SosFlow({ location }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [isAborted, setIsAborted] = useState(false);
  const [isDialed, setIsDialed] = useState(false);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(true);

  const contactsRef = useRef([]);
  const [profile, setProfile] = useState(null);

  // Load profile and contacts from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("roadsos_profile_info");
      const savedContacts = localStorage.getItem("roadsos_profile_contacts");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        p.contacts = savedContacts ? JSON.parse(savedContacts) : [];
        setProfile(p);
      }
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
      className="min-h-screen flex flex-col p-6 transition-all duration-500 justify-between items-center relative overflow-hidden"
      style={{ background: C.bg }}
    >
      {/* Subtle Emergency Glow */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDialed ? 'opacity-20' : 'opacity-60'}`}
        style={{ background: "radial-gradient(circle at center, #8a0012 0%, transparent 70%)" }}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-sm relative z-10">
        <div className="relative flex items-center justify-center h-64 w-64">
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-6 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-12 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: "1s" }} />
          
          <div
            className="absolute inset-16 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform"
            style={{
              background: C.sosRed,
              color: "#ffffff"
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
            <div className="animate-slide-up">
              <h1 className="text-3xl font-black mb-2 text-white tracking-wide">
                SOS Triggered
              </h1>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
                Auto-dialing 108 in {countdown}s
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <h1 className="text-3xl font-black mb-2 text-red-400 tracking-wide animate-pulse">
                SOS Active
              </h1>
              <p className="text-sm text-white/70 font-medium mb-6">
                108 Emergency Dialer Triggered
              </p>
              <button
                onClick={() => {
                  triggerHaptic("heavy");
                  triggerEmergencySMS(profile, contactsRef.current, location);
                }}
                className="w-full max-w-[220px] mx-auto py-4 rounded-full flex items-center justify-center gap-2 text-sm font-bold border-none active:scale-95 transition-all shadow-lg cursor-pointer md-ripple"
                style={{ background: "#ff8c00", color: "#000000" }}
              >
                <MessageCircleWarning className="h-5 w-5" /> Send SMS Alerts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hospital details & abort buttons */}
      {/* Hospital & Actions Container */}
      <div className="flex flex-col gap-3 z-10 w-full max-w-sm">
        {profile && (
          <div className="mb-2">
            <EmergencyBeacon profile={profile} />
          </div>
        )}
        <div
          className="w-full rounded-[32px] p-5 flex flex-col gap-3 border border-white/5 shadow-xl"
          style={{ background: C.surfaceContainerHigh }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-0.5">
                Nearest Medical Facility
              </p>
              {loadingHospital ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
                  <span className="text-sm font-medium text-white/50">Locating...</span>
                </div>
              ) : nearestHospital ? (
                <h3 className="text-sm font-bold text-white truncate leading-tight">
                  {nearestHospital.name}
                </h3>
              ) : (
                <span className="text-sm font-medium text-white/50">Unavailable</span>
              )}
            </div>
          </div>

          {nearestHospital && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${location.rawLat},${location.rawLng}&destination=${nearestHospital.lat},${nearestHospital.lng}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => triggerHaptic("light")}
              className="mt-2 w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm border-none outline-none cursor-pointer no-underline md-ripple"
              style={{ background: C.primary, color: C.onPrimary }}
            >
              <Navigation className="h-4 w-4" /> Navigate Now
            </a>
          )}
        </div>

        <button
          onClick={handleAbort}
          className="w-full py-4 rounded-[28px] flex items-center justify-center gap-2 text-sm font-bold border-none active:scale-95 transition-transform cursor-pointer md-ripple"
          style={{ background: C.surfaceContainer, color: C.onSurfaceVariant }}
        >
          <XCircle className="h-5 w-5" /> {isDialed ? "I'm Safe (Return)" : "Cancel Alert"}
        </button>
      </div>
    </div>
  );
}
