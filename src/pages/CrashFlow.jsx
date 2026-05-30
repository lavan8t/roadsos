import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, XCircle, MessageCircleWarning, Activity } from "lucide-react";
import { triggerEmergencySMS } from "../services/api";
import { C } from "../constants/theme";
import { triggerHaptic } from "../components/Shared";

export default function CrashFlow({ location }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isAborted, setIsAborted] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

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

  // Countdown & Haptic Alarm Pattern
  useEffect(() => {
    if (countdown > 0 && !isAborted) {
      const timer = setTimeout(() => {
        // Haptic pulse
        triggerHaptic("heavy");
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isAborted && !isDispatched) {
      setIsDispatched(true);
      // Double strong pulse on dispatch
      triggerHaptic("heavy");
      setTimeout(() => triggerHaptic("heavy"), 250);
      
      // Auto dispatch SMS
      triggerEmergencySMS(profileRef.current, contactsRef.current, location, "CAR_CRASH_DETECTED");
    }
  }, [countdown, isAborted, isDispatched, location]);

  const handleAbort = () => {
    triggerHaptic("light");
    setIsAborted(true);
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col p-6 transition-all duration-500 justify-between items-center"
      style={{
        background: isDispatched
          ? "radial-gradient(circle, #ea580c 0%, #0d0a0a 100%)" // Orange to black
          : "radial-gradient(circle, #7c2d12 0%, #0d0a0a 100%)" // Dark orange to black
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
        <div className="relative flex items-center justify-center h-52 w-52">
          {/* Animated concentric rings */}
          <div className="absolute inset-0 rounded-full bg-orange-600/10 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-4 rounded-full bg-orange-600/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-8 rounded-full bg-orange-600/30 animate-ping" style={{ animationDuration: "1s" }} />
          
          <div
            className="absolute inset-12 rounded-full flex flex-col items-center justify-center md-elevation-4 border-none text-white select-none transition-transform"
            style={{
              background: "#ea580c",
              boxShadow: "0 0 40px rgba(234, 88, 12, 0.6)"
            }}
          >
            {!isDispatched ? (
              <div className="flex flex-col items-center gap-2 select-none relative w-full h-full justify-center">
                <Activity
                  className="h-14 w-14 mb-1 animate-pulse"
                  strokeWidth={2.5}
                />
                <span className="text-[40px] font-black leading-none tracking-widest">
                  {countdown}s
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 select-none text-center justify-center">
                <MessageCircleWarning className="h-14 w-14 text-white animate-pulse" strokeWidth={2} />
                <span className="text-[12px] uppercase font-black tracking-widest mt-2">DISPATCHED</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          {!isDispatched ? (
            <>
              <h1 className="text-3xl font-black mb-1 text-white tracking-widest uppercase">
                Crash Detected
              </h1>
              <p className="text-sm text-orange-200 font-medium">
                Are you okay? Sending emergency SMS alerts in {countdown}s
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mb-1 text-orange-300 tracking-widest uppercase animate-pulse">
                Alerts Sent
              </h1>
              <p className="text-sm text-green-300 font-bold">
                Emergency SMS has been triggered.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 z-10 pb-8 w-full max-w-sm">
        {/* Abort button */}
        {!isDispatched ? (
          <button
            onClick={handleAbort}
            className="w-full h-16 rounded-[24px] flex items-center justify-center gap-3 text-md font-black bg-white text-orange-950 border-none active:scale-95 transition-transform cursor-pointer"
          >
            <XCircle className="h-5 w-5" /> I'm Safe (Cancel Alert)
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="w-full h-16 rounded-[24px] flex items-center justify-center gap-3 text-md font-black bg-white/10 text-white border border-white/20 active:scale-95 transition-transform cursor-pointer"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
}
