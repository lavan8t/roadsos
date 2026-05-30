import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShieldAlert, Heart, Phone, Clock, Save, BellRing, FileJson, XCircle, MessageCircleWarning, QrCode } from "lucide-react";
import { PageHeader, triggerHaptic } from "../components/Shared";
import { triggerEmergencySMS } from "../services/api";
import { C } from "../constants/theme";
import EmergencyBeacon from "../components/EmergencyBeacon";

export default function Profile({ location }) {
  const navigate = useNavigate();

  // Profile Info State
  const [profile, setProfile] = useState({
    name: "",
    bloodGroup: "",
    conditions: "",
    allergies: "",
    medications: "",
    gender: "",
    age: "",
    vehicle: "",
    lockScreenBeacon: true,
  });

  // Emergency Contacts State
  const [contacts, setContacts] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  // Safety Timer State
  const [safetyCheckEnabled, setSafetyCheckEnabled] = useState(false);
  const [safetyCheckInterval, setSafetyCheckInterval] = useState(1); // Default 1 minute

  // Modal State
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("roadsos_profile_info");
      const savedContacts = localStorage.getItem("roadsos_profile_contacts");
      const savedSafetyEnabled = localStorage.getItem("roadsos_safety_enabled");
      const savedSafetyInterval = localStorage.getItem("roadsos_safety_interval");

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        // Ensure we always have 2 slots
        const padded = [...parsed];
        while (padded.length < 2) padded.push({ name: "", phone: "" });
        setContacts(padded.slice(0, 2));
      }
      if (savedSafetyEnabled) setSafetyCheckEnabled(savedSafetyEnabled === "true");
      if (savedSafetyInterval) setSafetyCheckInterval(parseInt(savedSafetyInterval));
    } catch (e) {
      console.warn("Failed to load emergency profile", e);
    }
  }, []);

  const handleProfileChange = (field, val) => {
    setProfile(prev => ({ ...prev, [field]: val }));
  };

  const handleContactChange = (index, field, val) => {
    setContacts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleToggleSafetyCheck = async (e) => {
    triggerHaptic("light");
    const checked = e.target.checked;
    setSafetyCheckEnabled(checked);

    if (checked && "Notification" in window) {
      if (Notification.permission !== "granted") {
        const res = await Notification.requestPermission();
        if (res !== "granted") {
          alert("Notification permissions are required for the Safety Check background alerts.");
          setSafetyCheckEnabled(false);
        }
      }
    }
  };

  const handleSave = () => {
    try {
      triggerHaptic("medium");

      // Validation
      if (!profile.name.trim()) {
        setErrorMsg("Please enter your Full Name.");
        return;
      }
      if (!profile.bloodGroup) {
        setErrorMsg("Please select your Blood Group.");
        return;
      }

      // Filter valid contacts
      const validContacts = contacts.filter(c => c.name.trim() && c.phone.trim().length >= 7);
      if (validContacts.length === 0) {
        setErrorMsg("Please add at least one emergency contact with a valid name and phone number.");
        return;
      }
      
      setErrorMsg("");

      // Save profile info
      localStorage.setItem("roadsos_profile_info", JSON.stringify(profile));

      localStorage.setItem("roadsos_profile_contacts", JSON.stringify(validContacts));

      // Save safety timer options
      localStorage.setItem("roadsos_safety_enabled", safetyCheckEnabled ? "true" : "false");
      localStorage.setItem("roadsos_safety_interval", safetyCheckInterval.toString());

      // Send start/cancel timer request to Service Worker
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        if (safetyCheckEnabled) {
          navigator.serviceWorker.controller.postMessage({
            type: "START_SAFETY_TIMER",
            intervalMs: safetyCheckInterval * 60 * 1000,
          });
        } else {
          navigator.serviceWorker.controller.postMessage({
            type: "CANCEL_SAFETY_TIMER",
          });
        }
      }

      navigate("/");
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save profile.");
    }
  };

  return (
    <div
      className="h-[100dvh] flex flex-col p-6 overflow-y-auto pb-12"
      style={{ background: C.bg }}
    >
      <PageHeader title="Emergency Profile" />

      <div className="flex flex-col gap-6 z-10 w-full max-w-md mx-auto">
        {/* Emergency Beacon QR */}
        <EmergencyBeacon profile={profile} defaultExpanded={true} />

        {/* Section 1: Emergency Information */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{ background: C.surfaceContainer }}
        >
          <h2 className="text-md font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#ff5449]" /> Emergency Info
          </h2>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Full Name
              <input
                type="text"
                value={profile.name}
                onChange={e => handleProfileChange("name", e.target.value)}
                placeholder="e.g. John Doe"
                className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                style={{ background: C.surfaceContainerHigh }}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
                Age
                <input
                  type="number"
                  value={profile.age}
                  onChange={e => handleProfileChange("age", e.target.value)}
                  placeholder="e.g. 35"
                  className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                  style={{ background: C.surfaceContainerHigh }}
                />
              </label>

              <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
                Gender
                <select
                  value={profile.gender}
                  onChange={e => {
                    triggerHaptic("light");
                    handleProfileChange("gender", e.target.value);
                  }}
                  className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                  style={{ background: C.surfaceContainerHigh }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Blood Group
              <select
                value={profile.bloodGroup}
                onChange={e => {
                  triggerHaptic("light");
                  handleProfileChange("bloodGroup", e.target.value);
                }}
                className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                style={{ background: C.surfaceContainerHigh }}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Medical Conditions
              <textarea
                value={profile.conditions}
                onChange={e => handleProfileChange("conditions", e.target.value)}
                placeholder="e.g. Asthma, Diabetes, Heart Patient"
                rows={2}
                className="p-3.5 rounded-xl border-none outline-none text-white text-sm font-medium resize-none"
                style={{ background: C.surfaceContainerHigh }}
              />
            </label>

            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Allergies
              <textarea
                value={profile.allergies}
                onChange={e => handleProfileChange("allergies", e.target.value)}
                placeholder="e.g. Penicillin, Peanuts"
                rows={2}
                className="p-3.5 rounded-xl border-none outline-none text-white text-sm font-medium resize-none"
                style={{ background: C.surfaceContainerHigh }}
              />
            </label>

            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Current Medications
              <textarea
                value={profile.medications}
                onChange={e => handleProfileChange("medications", e.target.value)}
                placeholder="e.g. Inhaler, Insulin"
                rows={2}
                className="p-3.5 rounded-xl border-none outline-none text-white text-sm font-medium resize-none"
                style={{ background: C.surfaceContainerHigh }}
              />
            </label>

            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5">
              Vehicle Number (Optional)
              <input
                type="text"
                value={profile.vehicle}
                onChange={e => handleProfileChange("vehicle", e.target.value)}
                placeholder="e.g. TN-01-AB-1234"
                className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                style={{ background: C.surfaceContainerHigh }}
              />
            </label>
          </div>
        </div>

        {/* Section 2: Emergency Contacts */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{ background: C.surfaceContainer }}
        >
          <h2 className="text-md font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#ff5449]" /> Emergency Contacts
          </h2>

          {contacts.map((contact, index) => (
            <div key={index} className="flex flex-col gap-3 border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <p className="text-[12px] font-bold text-white/50 uppercase">
                Contact #{index + 1}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contact.name}
                  onChange={e => handleContactChange(index, "name", e.target.value)}
                  placeholder="Name"
                  className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                  style={{ background: C.surfaceContainerHigh }}
                />
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={e => handleContactChange(index, "phone", e.target.value)}
                  placeholder="Phone"
                  className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                  style={{ background: C.surfaceContainerHigh }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Section 2b: Emergency Beacon */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{ background: C.surfaceContainer }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-md font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
              <User className="h-5 w-5 text-[#ff5449]" /> Emergency Beacon
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.lockScreenBeacon !== false} // Default true
                onChange={e => {
                  triggerHaptic("light");
                  handleProfileChange("lockScreenBeacon", e.target.value === "on" ? e.target.checked : e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <p className="text-[13px] text-[#d0c4b5] leading-relaxed">
            Show Emergency Beacon automatically when app is opened (Lock Screen mode) to provide immediate responder access without navigation.
          </p>
        </div>

        {/* Section 3: Safety Check Timer */}
        <div
          className="rounded-[28px] p-5 flex flex-col gap-4"
          style={{ background: C.surfaceContainer }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-md font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#ff5449]" /> Safety Timer
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={safetyCheckEnabled}
                onChange={handleToggleSafetyCheck}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <p className="text-[13px] text-[#d0c4b5] leading-relaxed">
            Safety Timer automatically prompts you to verify you are safe at selected intervals. If you do not respond, an emergency alert is triggered.
          </p>

          {safetyCheckEnabled && (
            <label className="flex flex-col text-[13px] font-bold text-[#d0c4b5] gap-1.5 animate-slide-up">
              Verification Interval
              <select
                value={safetyCheckInterval}
                onChange={e => {
                  triggerHaptic("light");
                  setSafetyCheckInterval(parseInt(e.target.value));
                }}
                className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                style={{ background: C.surfaceContainerHigh }}
              >
                <option value={1}>1 Minute (Demo / Test)</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </label>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-[24px] text-left flex items-start gap-3 border border-red-500/20 bg-red-950/20 text-red-200 mt-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
            <p className="text-[13px] font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Action Button: Save */}
        <button
          onClick={handleSave}
          className="w-full h-16 rounded-[24px] flex items-center justify-center gap-3 text-[18px] font-black cursor-pointer border-none outline-none md-ripple active:scale-95 transition-all mb-2"
          style={{ background: C.primary, color: C.onPrimary }}
        >
          <Save className="h-6 w-6" /> Save Profile
        </button>

        <button
          onClick={() => setShowPreview(true)}
          className="w-full h-14 rounded-[24px] flex items-center justify-center gap-3 text-[16px] font-black cursor-pointer border border-white/20 outline-none active:scale-95 transition-all mb-4"
          style={{ background: "transparent", color: C.onSurface }}
        >
          <FileJson className="h-5 w-5" /> Preview SMS Payload
        </button>

        {/* JSON Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="w-full max-w-sm rounded-[24px] p-6 flex flex-col gap-4 border border-white/20" style={{ background: C.surfaceContainerHigh }}>
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2"><FileJson className="h-5 w-5"/> SMS JSON Payload</h3>
                <button onClick={() => setShowPreview(false)} className="text-white/50 hover:text-white border-none bg-transparent cursor-pointer">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <pre className="text-xs text-green-400 bg-black/50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono max-h-[60vh] overflow-y-auto">
{JSON.stringify({
  msg: "EMERGENCY SOS",
  user: profile,
  contacts: contacts.filter(c => c.name && c.phone),
  loc: location ? {
    lat: location.rawLat,
    lng: location.rawLng,
    url: `https://maps.google.com/?q=${location.rawLat},${location.rawLng}`
  } : "Unavailable"
}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Dev Options */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Developer Options</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                triggerHaptic("heavy");
                localStorage.removeItem("roadsos_onboarded");
                window.location.href = "/";
              }}
              className="px-6 py-2 rounded-full border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
            >
              Reset Onboarding
            </button>
            <button
              onClick={() => {
                triggerHaptic("heavy");
                navigate("/crash");
              }}
              className="px-6 py-2 rounded-full border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/10 active:scale-95 transition-all cursor-pointer"
            >
              Simulate Car Crash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
