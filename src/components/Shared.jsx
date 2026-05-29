import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  WifiOff,
  Wifi,
  MapPin,
  Copy,
  Check,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { C } from "../constants/theme";

export function AppLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 flex-shrink-0" fill="none">
      <path
        d="M16 2 L28 6 V14 C28 22 22 28 16 30 C10 28 4 22 4 14 V6 Z"
        fill={C.primaryContainer}
      />
      <path
        d="M12 30 L16 12 L20 30"
        stroke={C.onPrimaryContainer}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12" r="3" fill={C.primary} />
    </svg>
  );
}

export function StatusHeader({ isOnline }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center justify-between w-full pb-2"
      style={{ animation: "slide-up-md 0.3s ease-out both" }}
    >
      <div className="flex items-center gap-2.5">
        <AppLogo />
        <h1
          className="text-[24px] font-black tracking-wide"
          style={{ color: C.onSurface }}
        >
          Road<span style={{ color: C.primary }}>SoS</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-transparent border-none outline-none"
          style={{ color: C.onSurfaceVariant }}
        >
          <Settings className="h-6 w-6" />
        </button>
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full md-elevation-1"
          style={{ background: C.surfaceContainerHigh }}
        >
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-400" />
          ) : (
            <WifiOff className="h-5 w-5" style={{ color: C.error }} />
          )}
        </div>
      </div>
    </div>
  );
}

export function LocationCard({ location }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard
      ?.writeText(`${location.lat}, ${location.lng}`)
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [location]);

  return (
    <button
      onClick={handleCopy}
      className="w-full rounded-[24px] p-4 flex items-center gap-4 z-10 md-elevation-1 md-ripple border-none outline-none cursor-pointer text-left"
      style={{ background: C.surfaceContainer }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full"
        style={{ background: C.surfaceContainerHigh }}
      >
        <MapPin
          className="h-6 w-6"
          style={{ color: C.primary }}
          strokeWidth={1.8}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[18px] font-bold tracking-wide flex items-center gap-2"
          style={{ color: C.onSurface }}
        >
          {location.lat}, {location.lng}
          {location.cached && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-200">
              Cached
            </span>
          )}
        </p>
        <p
          className="text-[13px] font-medium mt-0.5 truncate"
          style={{ color: C.onSurfaceVariant }}
        >
          {location.name}
        </p>
      </div>
      <div
        className="flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0"
        style={{
          background: copied ? C.greenContainer : "transparent",
          color: copied ? C.onGreenContainer : C.onSurfaceVariant,
        }}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </div>
    </button>
  );
}

export function PageHeader({ title, backTo = "/" }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 w-full mb-6 z-10">
      <button
        onClick={() => navigate(backTo)}
        className="h-12 w-12 rounded-full flex items-center justify-center md-ripple cursor-pointer border-none outline-none"
        style={{ background: C.surfaceContainerHigh, color: C.onSurface }}
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h1
        className="text-[22px] font-black tracking-wide"
        style={{ color: C.onSurface }}
      >
        {title}
      </h1>
    </div>
  );
}
