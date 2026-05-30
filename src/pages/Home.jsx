import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Compass, FileWarning, TriangleAlert } from "lucide-react";
import { StatusHeader, LocationCard } from "../components/Shared";
import { C } from "../constants/theme";
import NearbyHelp from "./NearbyHelp";

export default function Home({ status }) {
  const navigate = useNavigate();
  const [showNearby, setShowNearby] = React.useState(false);
  const { isOnline, location } = status;

  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{ background: C.bg }}
    >
      <div className="max-w-md w-full h-[100dvh] flex flex-col justify-between px-6 py-6 relative z-10">
        <div className="flex flex-col gap-4">
          <StatusHeader isOnline={isOnline} />
          <LocationCard location={location} />
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <div className="radar-ring" />
          <div className="radar-ring" />
          <button
            onClick={() => navigate("/sos")}
            className="relative h-60 w-60 rounded-full cursor-pointer md-ripple flex flex-col items-center justify-center z-10 md-elevation-2 border-none"
            style={{ background: C.sosRed, color: "#ffffff" }}
          >
            <TriangleAlert
              className="h-16 w-16 mb-2 animate-pulse"
              strokeWidth={2.5}
            />
            <span className="text-[44px] font-black leading-none tracking-widest animate-pulse">
              SOS
            </span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 z-10 w-full mb-2">
          <button
            onClick={() => setShowNearby(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border-none h-24 bg-[#2b2927] text-[#d0c4b5]"
          >
            <Plus className="h-10 w-10 text-[#ffb4ab]" strokeWidth={3} />
            <span className="text-[13px] font-bold">Nearby</span>
          </button>
          <button
            onClick={() =>
              navigator.share?.({
                title: "My Location",
                text: `I need help at ${location.lat}, ${location.lng}`,
              })
            }
            className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border-none h-24 bg-[#004a77] text-[#c1e8ff]"
          >
            <Compass className="h-10 w-10 text-[#c1e8ff]" />
            <span className="text-[13px] font-bold">Share Loc</span>
          </button>
          <button
            onClick={() => navigate("/report")}
            className="flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 cursor-pointer md-ripple border-none h-24 bg-[#4b4319] text-[#e8d468]"
          >
            <FileWarning className="h-10 w-10 text-[#e8d468]" />
            <span className="text-[13px] font-bold">Report</span>
          </button>
        </div>
      </div>
      
      {showNearby && (
        <NearbyHelp 
          location={location} 
          onClose={() => setShowNearby(false)} 
        />
      )}
    </div>
  );
}
