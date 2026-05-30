import React, { useState } from "react";
import { HeartPulse, Phone, AlertTriangle, Navigation, MapPin, Pill, Syringe, CarFront, Contact, Info } from "lucide-react";
import { C } from "../constants/theme";
import { triggerHaptic } from "./Shared";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <div className="flex items-center gap-2 text-red-400 opacity-90">
        <Icon className="h-4 w-4" />
        <h3 className="text-[11px] font-black uppercase tracking-widest m-0">{title}</h3>
      </div>
      <div className="text-[15px] font-medium text-white leading-relaxed pl-6">
        {children || <span className="text-white/30 italic">Not provided</span>}
      </div>
    </div>
  );
}

export default function RescuerView({ profile, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const contacts = profile.contacts?.filter(c => c.name && c.phone) || [];

  const handleCopyLocation = () => {
    triggerHaptic("medium");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      navigator.clipboard.writeText(`Emergency Location: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0a0a] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-8">
        
        {/* Header Block */}
        <div className="bg-red-950/40 p-6 pt-10 pb-8 rounded-b-[40px] border-b border-red-500/20 shadow-2xl relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white border-none cursor-pointer active:scale-95 transition-transform z-10"
            >
              Close Preview
            </button>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-red-400 m-0">Medical ID</h1>
              <p className="text-xs text-red-200/70 m-0 mt-0.5">Scanned via SafeMiles Beacon</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white m-0 leading-tight tracking-tight">
            {profile.name || "Unknown Patient"}
          </h2>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="px-4 py-2 bg-red-500 rounded-xl flex items-center gap-2 shadow-lg">
              <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider">Blood</span>
              <span className="text-lg font-black text-white">{profile.bloodGroup || "--"}</span>
            </div>
            {profile.age && (
              <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Age</span>
                <span className="text-lg font-black text-white">{profile.age}</span>
              </div>
            )}
            {profile.gender && (
              <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2">
                <span className="text-lg font-black text-white">{profile.gender}</span>
              </div>
            )}
            {profile.aadhaar && (
              <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Aadhaar</span>
                <span className="text-lg font-black text-white">{profile.aadhaar}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 p-5">
          <a href="tel:108" onClick={() => triggerHaptic("heavy")} className="col-span-2 rounded-[24px] py-4 bg-red-600 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-transform no-underline">
            <Phone className="h-6 w-6" /> CALL EMERGENCY (108)
          </a>
          
          {contacts.length > 0 && (
            <a href={`tel:${contacts[0].phone}`} onClick={() => triggerHaptic("medium")} className="rounded-[20px] py-4 bg-[#2b2927] border border-white/10 text-white font-bold text-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform no-underline">
              <Contact className="h-6 w-6 text-[#ffb4ab]" />
              Call Contact
            </a>
          )}
          
          <button onClick={handleCopyLocation} className="rounded-[20px] py-4 bg-[#2b2927] border border-white/10 text-white font-bold text-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer border-none">
            <MapPin className="h-6 w-6 text-blue-400" />
            {copied ? "Copied!" : "Share Location"}
          </button>
        </div>

        {/* Medical Details */}
        <div className="p-6 flex flex-col bg-[#1e1918] mx-5 rounded-[32px] border border-white/5 shadow-xl">
          
          <Section title="Medical Conditions" icon={AlertTriangle}>
            {profile.conditions}
          </Section>

          <Section title="Allergies" icon={Info}>
            {profile.allergies}
          </Section>

          <Section title="Current Medications" icon={Pill}>
            {profile.medications}
          </Section>

          {profile.vehicle && (
            <Section title="Vehicle Information" icon={CarFront}>
              {profile.vehicle}
            </Section>
          )}

          <div className="h-px bg-white/10 w-full my-2" />

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2 text-red-400 opacity-90 mb-1">
              <Phone className="h-4 w-4" />
              <h3 className="text-[11px] font-black uppercase tracking-widest m-0">Emergency Contacts</h3>
            </div>
            
            {contacts.length > 0 ? contacts.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#2b2927] p-4 rounded-[20px]">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <span className="text-xs text-white/50">{c.phone}</span>
                </div>
                <a href={`tel:${c.phone}`} onClick={() => triggerHaptic("light")} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform">
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            )) : (
              <span className="text-[15px] font-medium text-white/30 italic pl-6">No contacts listed</span>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center px-6">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            Provided securely via SafeMiles Medical Identity
          </p>
        </div>
      </div>
    </div>
  );
}
