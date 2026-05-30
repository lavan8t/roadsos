import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  WifiOff,
  Wifi,
  MapPin,
  Check,
  ArrowLeft,
} from "lucide-react";
import { C } from "../constants/theme";

export function triggerHaptic(type = "light") {
  if (!navigator.vibrate) return;
  try {
    if (type === "light") {
      navigator.vibrate(12);
    } else if (type === "medium") {
      navigator.vibrate(35);
    } else if (type === "heavy") {
      navigator.vibrate([80, 50, 80]);
    }
  } catch (e) {
    console.warn("Haptic trigger failed", e);
  }
}

export function StatusHeader({ isOnline }) {
  const navigate = useNavigate();
  return (
    <div
      className="grid grid-cols-3 items-center w-full pb-2"
      style={{ animation: "slide-up-md 0.3s ease-out both" }}
    >
      <div className="flex justify-start">
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full"
          style={{ background: C.surfaceContainerHigh }}
        >
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-400" />
          ) : (
            <WifiOff className="h-5 w-5" style={{ color: C.error }} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <h1
          className="text-[24px] tracking-wide roadsos-title"
          style={{ color: C.onSurface }}
        >
          Safe<span className="text-[#ff5449]">Miles</span>
        </h1>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            triggerHaptic("light");
            navigate("/profile");
          }}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-transparent border-none outline-none cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
          style={{ color: C.onSurfaceVariant }}
        >
          <span className="material-symbols-rounded text-[28px] leading-none">account_circle</span>
        </button>
      </div>
    </div>
  );
}

export function LocationCard({ location }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (location.lat && location.lng) {
      triggerHaptic("light");
      navigator.clipboard
        ?.writeText(`${location.lat}, ${location.lng}`)
        .catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [location]);

  const isDenied = location.status === "denied";
  const isPending = location.status === "pending";

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-3 z-10 border-none outline-none cursor-pointer bg-transparent py-3 px-4 hover:opacity-90 active:scale-[0.99] transition-all"
    >
      {copied ? (
        <Check className="h-6 w-6 text-green-400 flex-shrink-0" strokeWidth={3} />
      ) : (
        <MapPin
          className="h-6 w-6 flex-shrink-0"
          style={{ color: isDenied ? C.error : C.primary }}
          strokeWidth={3}
        />
      )}
      <div className="text-left">
        <h2
          className="text-[18px] font-extrabold tracking-wide leading-tight"
          style={{ color: C.onSurface }}
        >
          {location.name}
        </h2>
        {(copied || isDenied || isPending) && (
          <p
            className="text-[13px] font-medium mt-1.5 flex items-center gap-1.5"
            style={{ color: copied ? C.primary : C.onSurfaceVariant }}
          >
            {copied && "Copied!"}
            {isDenied && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900 text-red-200">
                Denied
              </span>
            )}
            {isPending && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-200">
                Locating...
              </span>
            )}
          </p>
        )}
      </div>
    </button>
  );
}

export function PageHeader({ title, backTo = "/", rightAction }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 w-full mb-6 z-10">
      <button
        onClick={() => {
          triggerHaptic("light");
          navigate(backTo);
        }}
        className="h-12 w-12 rounded-full flex items-center justify-center md-ripple cursor-pointer border-none outline-none"
        style={{ background: C.surfaceContainerHigh, color: C.onSurface }}
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h1
        className="text-[22px] font-black tracking-wide flex-1"
        style={{ color: C.onSurface }}
      >
        {title}
      </h1>
      {rightAction && (
        <div className="ml-auto flex items-center justify-center">
          {rightAction}
        </div>
      )}
    </div>
  );
}
