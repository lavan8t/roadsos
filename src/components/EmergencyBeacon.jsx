import React, { useState } from "react";
import { QRCode } from "react-qr-code";
import { User, Activity, TriangleAlert, Expand, Shrink, FileJson, HeartPulse, ExternalLink } from "lucide-react";
import { C } from "../constants/theme";
import { triggerHaptic } from "./Shared";

export const encodeProfile = (profile) => {
  if (!profile) return "";
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(profile))));
  } catch (e) {
    return "";
  }
};

export const decodeProfile = (encoded) => {
  if (!encoded) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch (e) {
    return null;
  }
};

export default function EmergencyBeacon({ profile, onPreviewClick }) {
  // Check if critical info is missing
  const hasMedicalInfo = profile?.bloodGroup && profile?.conditions;
  const hasContacts = profile?.contacts && profile.contacts.some(c => c.name && c.phone);
  
  const isReady = hasMedicalInfo && hasContacts;
  
  const beaconDataUrl = `https://safemiles.vercel.app/?beacon_scan=true&data=${encodeProfile(profile)}`;

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Profile Owner</span>
          <span className="text-lg font-black text-white">{profile?.name || "Unknown"}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Blood Type</span>
          <span className="text-lg font-black text-red-400">{profile?.bloodGroup || "--"}</span>
        </div>
      </div>

      <div className="w-full aspect-square max-w-[240px] mx-auto bg-white p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,0,0,0.15)] border-4 border-white">
        <QRCode 
          value={beaconDataUrl} 
          size={256} 
          style={{ height: "100%", maxWidth: "100%", width: "100%" }}
          level="M"
        />
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {!hasMedicalInfo && (
          <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold flex items-center gap-2">
            <TriangleAlert className="h-4 w-4" /> Medical Information Missing
          </div>
        )}
        {!hasContacts && (
          <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold flex items-center gap-2">
            <TriangleAlert className="h-4 w-4" /> Emergency Contacts Missing
          </div>
        )}
        {isReady && (
          <p className="text-xs text-white/60 text-center px-4">
            This QR code securely contains your medical info. Responders can scan it using any smartphone camera without installing an app.
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic("medium");
          if (onPreviewClick) onPreviewClick();
        }}
        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border-none cursor-pointer md-ripple shadow-lg"
        style={{ background: C.surfaceContainerHigh, color: C.onSurface }}
      >
        <ExternalLink className="h-4 w-4" /> Preview Rescuer View
      </button>
    </div>
  );
}
