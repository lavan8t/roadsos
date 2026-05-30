import React, { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAppStatus } from "./hooks/useAppStatus";
import { MapPinOff, Loader2, ShieldAlert, Check } from "lucide-react";
import { C } from "./constants/theme";
import { triggerHaptic } from "./components/Shared";

// Pages
import Home from "./pages/Home";
import NearbyHelp from "./pages/NearbyHelp";
import SosFlow from "./pages/SosFlow";
import ReportIncident from "./pages/ReportIncident";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";

function LocationBlockedScreen({ retry }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: C.bg }}
    >
      <div
        className="max-w-sm w-full p-8 rounded-[32px] flex flex-col items-center gap-6 z-10"
        style={{
          background: C.surfaceContainer,
          border: "1px solid rgba(255, 180, 171, 0.1)",
          animation: "slide-up-md 0.5s ease-out both",
        }}
      >
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center"
          style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}
        >
          <MapPinOff className="h-10 w-10 text-[#ff5449]" />
        </div>

        <div>
          <h1
            className="text-[24px] font-black mb-3"
            style={{ color: C.onSurface }}
          >
            Location Required
          </h1>
          <p
            className="text-[14px] leading-relaxed mb-4 text-balance"
            style={{ color: C.onSurfaceVariant }}
          >
            RoadSOS cannot function without location access. We need your coordinates to find nearby emergency services and dispatch help.
          </p>
          <div
            className="p-3.5 rounded-2xl text-[12px] text-left leading-normal"
            style={{ background: C.surfaceContainerHigh, color: C.onSurfaceVariant }}
          >
            <strong>How to enable:</strong> Click the settings/lock icon next to the URL in your browser's address bar and set Location to <strong>Allow</strong>.
          </div>
        </div>

        <button
          onClick={retry}
          className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold cursor-pointer border-none outline-none md-ripple active:scale-95 transition-all"
          style={{ background: C.primary, color: C.onPrimary }}
        >
          Retry Location Access
        </button>
      </div>
    </div>
  );
}

function LocationLoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: C.bg }}
    >
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin text-[#ffb4ab]" />
        <h1
          className="text-[28px] tracking-wide roadsos-title"
          style={{ color: C.onSurface }}
        >
          RoadSOS
        </h1>
        <p className="text-[14px]" style={{ color: C.onSurfaceVariant }}>
          Securing safe connection and live GPS location...
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const status = useAppStatus();
  const navigate = useNavigate();

  // Safety Modal State
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyCountdown, setSafetyCountdown] = useState(15);

  const safetyIntervalRef = useRef(null);
  const safetyCountdownRef = useRef(null);

  // Reset the safety check timer based on local storage settings
  const resetSafetyTimer = useCallback(() => {
    // Clear existing interval
    if (safetyIntervalRef.current) clearInterval(safetyIntervalRef.current);
    
    // Check if enabled
    const isEnabled = localStorage.getItem("roadsos_safety_enabled") === "true";
    const intervalMinutes = parseInt(localStorage.getItem("roadsos_safety_interval") || "1");
    
    if (isEnabled && status.onboardingComplete) {
      const intervalMs = intervalMinutes * 60 * 1000;
      safetyIntervalRef.current = setInterval(() => {
        setShowSafetyModal(true);
        setSafetyCountdown(15);
      }, intervalMs);
    }
  }, [status.onboardingComplete]);

  // Set up timer on mount / when settings change
  useEffect(() => {
    resetSafetyTimer();
    
    // Listen for storage changes (to pick up updates from Profile page)
    const handleStorageChange = () => resetSafetyTimer();
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      if (safetyIntervalRef.current) clearInterval(safetyIntervalRef.current);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [resetSafetyTimer]);

  // Handle countdown when modal is active
  useEffect(() => {
    if (showSafetyModal) {
      safetyCountdownRef.current = setInterval(() => {
        setSafetyCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(safetyCountdownRef.current);
            setShowSafetyModal(false);
            triggerHaptic("heavy");
            navigate("/sos");
            return 0;
          }
          triggerHaptic("medium");
          return prev - 1;
        });
      }, 1000);
    } else {
      if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);
    }

    return () => {
      if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);
    };
  }, [showSafetyModal, navigate]);

  const handleImSafe = () => {
    triggerHaptic("light");
    setShowSafetyModal(false);
    resetSafetyTimer();
  };

  const handleTriggerSOS = () => {
    triggerHaptic("heavy");
    setShowSafetyModal(false);
    navigate("/sos");
  };

  // Location Checks
  const isLocationDenied = status.onboardingComplete && (status.location.status === "denied" || status.location.status === "error");
  const isLocationPending = status.onboardingComplete && status.location.status === "pending";

  if (isLocationDenied) {
    return <LocationBlockedScreen retry={status.fetchLocation} />;
  }

  if (isLocationPending) {
    return <LocationLoadingScreen />;
  }

  return (
    <>
      <Routes>
        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            !status.onboardingComplete ? (
              <Onboarding finishOnboarding={status.finishOnboarding} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Protected Home Route */}
        <Route
          path="/"
          element={
            status.onboardingComplete ? (
              <Home status={status} />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />

        {/* Standard App Routes */}
        <Route path="/sos" element={<SosFlow location={status.location} />} />
        <Route path="/help" element={<NearbyHelp location={status.location} />} />
        <Route path="/report" element={<ReportIncident location={status.location} />} />
        <Route path="/profile" element={<Profile location={status.location} />} />
      </Routes>

      {/* Safety Modal Overlay */}
      {showSafetyModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-6 text-center backdrop-blur-md"
          style={{ background: "rgba(74, 0, 5, 0.9)" }}
        >
          <div
            className="max-w-sm w-full p-8 rounded-[32px] flex flex-col items-center gap-6 border border-red-500/20"
            style={{
              background: C.surfaceContainer,
              animation: "slide-up-md 0.4s ease-out both",
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-red-500/20 animate-ping" />
              <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center border-2 border-red-400">
                <ShieldAlert className="h-9 w-9 text-white animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">Are you safe?</h2>
              <p className="text-sm text-red-200 leading-relaxed mb-1">
                Your Safety Check Timer has expired.
              </p>
              <p className="text-xs text-white/50">
                Broadcasting emergency details in <strong className="text-red-400 text-sm">{safetyCountdown}s</strong>
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleImSafe}
                className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-md font-bold cursor-pointer border-none outline-none bg-green-700 hover:bg-green-600 text-white active:scale-95 transition-all"
              >
                <Check className="h-5 w-5" /> Yes, I'm Safe
              </button>
              <button
                onClick={handleTriggerSOS}
                className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-md font-bold cursor-pointer border-2 border-red-500/30 bg-transparent hover:bg-white/5 text-red-400 active:scale-95 transition-all"
              >
                No, Send SOS Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}