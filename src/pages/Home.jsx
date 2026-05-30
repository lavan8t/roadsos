import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Compass, FileWarning, TriangleAlert, MapPin, Navigation, Clock, ShieldAlert, History, ChevronDown, ChevronUp, X, Car, Bike, Footprints, Train, Bus, Loader2, Check, Wifi, WifiOff, User } from "lucide-react";
import { triggerHaptic } from "../components/Shared";
import { C } from "../constants/theme";
import NearbyHelp from "./NearbyHelp";
import { useJourney } from "../hooks/useJourney";
import { searchDestination } from "../services/api";
import EmergencyBeacon, { decodeProfile } from "../components/EmergencyBeacon";
import RescuerView from "../components/RescuerView";

function DynamicIslandHeader({ isOnline, location }) {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-[#2b2927]/90 backdrop-blur-xl rounded-[32px] p-2 flex items-center justify-between border border-white/10 shadow-2xl pointer-events-auto">
      <div className="flex items-center gap-3 pl-3">
        <div className="flex items-center justify-center">
           {isOnline ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">{isOnline ? 'Network Active' : 'Offline Mode'}</span>
          <span className="text-sm font-bold text-white truncate max-w-[180px]">{location?.name || "Locating..."}</span>
        </div>
      </div>
      <button 
        onClick={() => { triggerHaptic("light"); navigate("/profile"); }}
        className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/90 border border-white/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer mr-1"
      >
        <User className="h-5 w-5" />
      </button>
    </div>
  );
}

function JourneySetupModal({ onClose, onStart, location }) {
  const [dest, setDest] = useState("");
  const [mode, setMode] = useState("Car");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const modes = [
    { id: "Car", icon: Car },
    { id: "Bike", icon: Bike },
    { id: "Walking", icon: Footprints },
    { id: "Bus", icon: Bus },
    { id: "Train", icon: Train }
  ];
  
  const [showInfo, setShowInfo] = useState(false);

  // Debounced Search
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (dest.length > 2 && !selectedPlace) {
        setLoading(true);
        const results = await searchDestination(dest, location?.rawLat, location?.rawLng);
        setSuggestions(results || []);
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeout);
  }, [dest, location, selectedPlace]);

  const handleSelect = (place) => {
    setDest(place.name);
    setSelectedPlace(place);
    setSuggestions([]);
  };

  const handleStart = () => {
    if (!selectedPlace) return;
    onStart(selectedPlace.name, selectedPlace.lat, selectedPlace.lng, mode, "");
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col p-6 rounded-t-[32px] animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" style={{ background: C.bg, height: '75vh' }}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white leading-tight pr-4">Where are you heading towards?</h2>
            <button onClick={() => setShowInfo(!showInfo)} className="bg-transparent border-none text-blue-400 cursor-pointer shrink-0 mt-1">
              <ShieldAlert className="h-5 w-5" />
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-white border-none cursor-pointer shrink-0"><X className="h-5 w-5" /></button>
        </div>

        {showInfo && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
            <p className="text-xs text-blue-200 leading-relaxed font-medium m-0">
              <strong className="text-blue-400 uppercase tracking-widest text-[10px] block mb-1">Safe Journey Guardian</strong>
              SafeMiles will track your trip in the background. If you do not arrive at your destination by the expected time, we will automatically trigger an SOS to your emergency contacts.
            </p>
          </div>
        )}
        
        <div className="relative mb-6">
          <input 
            type="text" 
            value={dest}
            onChange={e => { setDest(e.target.value); setSelectedPlace(null); }}
            placeholder="Search here..."
            className="w-full bg-[#2b2927] border border-white/10 rounded-2xl p-4 pr-12 text-white placeholder-white/30 font-medium outline-none focus:border-[#ffb4ab]"
          />
          {loading && !selectedPlace && (
            <Loader2 className="absolute right-4 top-4 h-5 w-5 text-white/50 animate-spin" />
          )}
          {suggestions.length > 0 && (
            <div className="absolute top-16 left-0 right-0 bg-[#2b2927] border border-white/10 rounded-2xl overflow-hidden z-10 shadow-2xl max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSelect(s)} className="w-full p-4 text-left text-sm text-white/80 font-medium border-b border-white/5 bg-transparent hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-white/40" />
                  <span className="truncate">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="text-sm text-[#d0c4b5] mb-2 font-medium">Mode of Transport</label>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`flex items-center shrink-0 gap-2 px-4 py-3 rounded-xl border-none transition-all cursor-pointer ${mode === m.id ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#2b2927] text-white/70'}`}>
              <m.icon className="h-5 w-5" />
              <span className="font-bold text-sm">{m.id}</span>
            </button>
          ))}
        </div>

        <button onClick={handleStart} disabled={!selectedPlace} className="mt-auto w-full py-4 rounded-2xl bg-[#004a77] text-[#c1e8ff] font-bold text-lg border-none flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer md-ripple">
          <Navigation className="h-5 w-5" /> Start Guardian Tracking
        </button>
      </div>
    </>
  );
}

function ActiveJourneyCard({ journey, onEnd, onExtend }) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const remainMs = journey.currentEta - Date.now();
  const isLate = remainMs < 0;
  
  const etaTimeString = new Date(journey.currentEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="w-full z-10 rounded-[28px] p-3 flex items-center justify-between border border-white/5 bg-[#2b2927]/90 backdrop-blur-md cursor-pointer transition-all active:scale-95 shadow-lg animate-in fade-in"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Navigation className="h-5 w-5" />
          </div>
          <div className="text-left flex-1 min-w-0 pr-2">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-0.5 truncate">
              {journey.destination}
            </p>
            <p className={`text-sm font-bold truncate ${isLate ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              {isLate ? 'ETA Expired - Escalating' : `Arrive by ${etaTimeString}`}
            </p>
          </div>
        </div>
        <ChevronDown className="h-5 w-5 text-white/50 shrink-0 ml-2" />
      </button>
    );
  }

  return (
    <div className="w-full z-10 mb-4 rounded-[28px] overflow-hidden shadow-2xl border border-white/10 animate-slide-up" style={{ background: C.surfaceContainer }}>
      <div className="p-4 flex items-center justify-between bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-white/70 font-bold uppercase tracking-wide">Active Guardian</span>
        </div>
        <button onClick={() => setExpanded(false)} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full border-none cursor-pointer transition-colors">
          <ChevronUp className="h-5 w-5 text-white/70" />
        </button>
      </div>

      <div className="p-5 relative">
        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="h-12 w-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Navigation className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[12px] text-white/50 font-bold uppercase tracking-wider mb-0.5">Heading to</p>
            <h3 className="text-[17px] font-bold text-white leading-tight truncate">{journey.destination}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/20 rounded-2xl p-3 flex flex-col justify-center">
            <p className="text-[11px] text-white/50 font-medium mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Distance</p>
            <p className="text-sm font-bold text-white">{journey.distanceKm} km</p>
          </div>
          <div className="bg-black/20 rounded-2xl p-3 flex flex-col justify-center">
            <p className="text-[11px] text-white/50 font-medium mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Arrive by</p>
            <p className={`text-sm font-bold ${isLate ? 'text-red-400' : 'text-white'}`}>
              {isLate ? 'Late' : etaTimeString}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onExtend(15)} className="flex-1 py-3 rounded-xl bg-white/5 text-white text-sm font-bold border border-white/5 active:bg-white/10 cursor-pointer transition-colors">
            +15 Min
          </button>
          <button onClick={() => onEnd("completed")} className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold border-none shadow-lg cursor-pointer md-ripple">
            End Journey
          </button>
        </div>
      </div>

      <button onClick={() => setShowTimeline(!showTimeline)} className="w-full py-3 bg-black/20 flex items-center justify-center gap-2 text-xs font-bold text-white/50 border-none cursor-pointer hover:bg-black/30 transition-colors">
        {showTimeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Timeline
      </button>

      {showTimeline && (
        <div className="p-4 bg-black/30 border-t border-white/5 flex flex-col gap-3 max-h-40 overflow-y-auto">
          {journey.timeline.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-[10px] text-white/40 font-mono w-10 shrink-0">{new Date(t.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
              <div className="text-xs text-white/80 flex-1 truncate">{t.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SafetyVerificationModal({ onExtend, onSOS, profile }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#690005]/95 backdrop-blur-md animate-in fade-in duration-300" />
      <div className="fixed inset-x-0 bottom-0 z-50 p-6 pb-12 flex flex-col items-center animate-slide-up">
        <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,84,73,0.5)]">
          <ShieldAlert className="h-12 w-12 text-[#ffb4ab] animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 text-center">Safety Check</h2>
        <p className="text-center text-[#ffb4ab] mb-8 font-medium px-4">Your ETA has expired. Have you reached your destination safely?</p>
        
        <div className="w-full flex flex-col gap-3">
          {profile && (
            <div className="mb-2 pointer-events-auto">
              <EmergencyBeacon profile={profile} />
            </div>
          )}
          <button onClick={() => onExtend(0)} className="w-full py-4 rounded-2xl bg-[#ffb4ab] text-[#690005] font-black text-lg border-none flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl cursor-pointer">
            <Check className="h-6 w-6" /> Yes, I Reached Safely
          </button>
          <button onClick={() => onExtend(15)} className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold text-lg border border-white/20 flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
            <Clock className="h-6 w-6" /> Extend Journey (+15 min)
          </button>
          
          <div className="mt-8 flex flex-col items-center gap-3 w-full px-4">
            <div className="text-xs text-white/50 uppercase tracking-widest font-bold">Auto SOS Trigger in 2 minutes</div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-full animate-shrink-timer origin-left" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function JourneyHistory({ history }) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full z-10 rounded-3xl overflow-hidden border border-white/5 bg-[#2b2927]/90 backdrop-blur-md">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between border-none bg-transparent text-white font-bold text-sm cursor-pointer hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2"><History className="h-4 w-4 opacity-50" /> Journey History</div>
        {open ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronUp className="h-4 w-4 opacity-50" />}
      </button>
      {open && (
        <div className="p-4 pt-0 flex flex-col gap-3 border-t border-white/5 mt-2 max-h-40 overflow-y-auto hide-scrollbar">
          {history.map(j => (
            <div key={j.id} className="flex items-center justify-between bg-black/20 p-3 rounded-2xl">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-bold text-white mb-0.5 truncate">{j.destination}</p>
                <p className="text-[10px] text-white/50">{new Date(j.startTime).toLocaleDateString()} • {j.mode}</p>
              </div>
              <div className="text-xs font-bold text-green-400 capitalize shrink-0">{j.status.replace("_", " ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home({ status }) {
  const navigate = useNavigate();
  const [showNearby, setShowNearby] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { isOnline, location } = status;
  
  const journey = useJourney(location);

  const [profileData, setProfileData] = useState(null);
  const [showRescuerView, setShowRescuerView] = useState(false);
  const [rescuerProfile, setRescuerProfile] = useState(null);

  React.useEffect(() => {
    // Check if this is a QR scan hit
    const params = new URLSearchParams(window.location.search);
    if (params.get("beacon_scan") === "true") {
      const encoded = params.get("data");
      const decoded = decodeProfile(encoded);
      if (decoded) {
        setRescuerProfile(decoded);
        setShowRescuerView(true);
      }
      return; // Skip loading local profile since this might be a rescuer's phone
    }
    
    // Load local profile for the resident user
    try {
      const savedProfile = localStorage.getItem("roadsos_profile_info");
      const savedContacts = localStorage.getItem("roadsos_profile_contacts");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        p.contacts = savedContacts ? JSON.parse(savedContacts) : [];
        setProfileData(p);
        
        // Lock screen auto-pop check (simulate Lock Screen Mode)
        if (p.lockScreenBeacon !== false && !sessionStorage.getItem("roadsos_beacon_dismissed")) {
          // You could automatically show preview here, but to avoid annoyance let's just make it prominent
        }
      }
    } catch(e) {}
  }, []);

  React.useEffect(() => {
    if (journey.showVerificationModal) {
      triggerHaptic("heavy");
      const timeout = setTimeout(() => {
        if (journey.showVerificationModal) {
          navigate("/sos?autoTrigger=true");
        }
      }, 120000); // 2 minutes
      return () => clearTimeout(timeout);
    }
  }, [journey.showVerificationModal, navigate]);

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex justify-center" style={{ background: C.bg }}>
      <div className="max-w-md w-full h-full relative z-10 pointer-events-none">
        
        {/* TOP DYNAMIC ISLAND */}
        <div className="absolute top-6 inset-x-6 flex flex-col gap-3 z-30 pointer-events-none">
          <DynamicIslandHeader isOnline={isOnline} location={location} />
          
          {journey.activeJourney && (
            <div className="pointer-events-auto">
              <ActiveJourneyCard 
                journey={journey.activeJourney} 
                onEnd={journey.endJourney} 
                onExtend={journey.extendJourney} 
              />
            </div>
          )}
        </div>

        {/* CENTER SOS BUTTON */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="radar-ring" />
          <div className="radar-ring" />
          <button
            onClick={() => navigate("/sos")}
            className="relative h-60 w-60 rounded-full cursor-pointer md-ripple flex flex-col items-center justify-center z-20 md-elevation-2 border-none pointer-events-auto shadow-[0_0_80px_rgba(255,84,73,0.3)]"
            style={{ background: C.sosRed, color: "#ffffff" }}
          >
            <TriangleAlert className="h-16 w-16 mb-2 animate-pulse" strokeWidth={2.5} />
            <span className="text-[44px] font-black leading-none tracking-widest animate-pulse">SOS</span>
          </button>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="absolute bottom-6 inset-x-6 flex flex-col justify-end gap-3 z-30 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 w-full">
            {!journey.activeJourney && (
              <button onClick={() => setShowSetup(true)} className="w-full py-4 rounded-2xl bg-[#004a77]/80 text-[#c1e8ff] font-bold text-sm border border-[#004a77]/50 flex items-center justify-center gap-2 md-ripple cursor-pointer backdrop-blur-xl shadow-lg">
                <Navigation className="h-5 w-5" /> Where are you heading towards?
              </button>
            )}

            <div className="grid grid-cols-3 gap-3 w-full">
              <button onClick={() => setShowNearby(true)} className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border border-white/10 h-20 bg-[#2b2927]/90 backdrop-blur-xl text-[#d0c4b5] shadow-lg">
                <Plus className="h-8 w-8 text-[#ffb4ab]" strokeWidth={3} />
                <span className="text-xs font-bold">Nearby</span>
              </button>
              <button onClick={() => navigator.share?.({ title: "My Location", text: `I need help at ${location.lat}, ${location.lng}` })} className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border border-[#004a77]/30 h-20 bg-[#004a77]/90 backdrop-blur-xl text-[#c1e8ff] shadow-lg">
                <Compass className="h-8 w-8 text-[#c1e8ff]" />
                <span className="text-xs font-bold">Share Loc</span>
              </button>
              <button onClick={() => navigate("/report")} className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border border-[#4b4319]/30 h-20 bg-[#4b4319]/90 backdrop-blur-xl text-[#e8d468] shadow-lg">
                <FileWarning className="h-8 w-8 text-[#e8d468]" />
                <span className="text-xs font-bold">Report</span>
              </button>
            </div>
            
            <JourneyHistory history={journey.journeyHistory} />
          </div>
        </div>
      </div>
      
      {showNearby && <NearbyHelp location={location} onClose={() => setShowNearby(false)} />}
      
      {showSetup && <JourneySetupModal onClose={() => setShowSetup(false)} onStart={(d, lat, lng, m, n) => { setShowSetup(false); journey.startJourney(d, lat, lng, m, n); }} location={location} />}
      
      {journey.showVerificationModal && (
        <SafetyVerificationModal 
          profile={profileData}
          onExtend={(mins) => {
            if (mins === 0) journey.endJourney("safely_reached");
            else journey.extendJourney(mins);
          }} 
          onSOS={() => navigate("/sos?autoTrigger=true")}
        />
      )}

      {showRescuerView && (
        <RescuerView 
          profile={rescuerProfile} 
          onClose={() => {
            setShowRescuerView(false);
            // If it was a scan, clean URL
            if (window.location.search.includes("beacon_scan")) {
               window.history.replaceState({}, document.title, window.location.pathname);
            }
          }} 
        />
      )}
    </div>
  );
}
