import React from "react";
import { useNavigate } from "react-router-dom";
import { TriangleAlert, Phone, Search, XCircle } from "lucide-react";
import { C } from "../constants/theme";

export default function SosFlow({ location }) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{ background: C.sosRed }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-white text-center gap-6 mt-10">
        <TriangleAlert className="h-24 w-24 animate-pulse" />
        <div>
          <h1 className="text-4xl font-black mb-2">EMERGENCY</h1>
          <p className="text-lg opacity-90">What do you need immediately?</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 z-10 pb-8">
        {/* Primary Action: Direct Call to Emergency Services */}
        <a
          href="tel:112"
          className="w-full bg-white text-red-600 rounded-3xl p-5 flex items-center justify-center gap-3 text-2xl font-black md-elevation-2 active:scale-95 transition-transform no-underline"
        >
          <Phone className="h-8 w-8" /> CALL 112 NOW
        </a>

        {/* Secondary Action: Route to Real-world Nearby Help (Hospitals/Police) */}
        <button
          onClick={() => navigate("/help")}
          className="w-full rounded-3xl p-5 flex items-center justify-center gap-3 text-xl font-bold bg-red-800 text-white border-none active:scale-95 transition-transform"
        >
          <Search className="h-6 w-6" /> Find Nearby Help
        </button>

        {/* Cancel Action: Reversible route back to Home */}
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-3xl p-5 flex items-center justify-center gap-3 text-lg font-bold bg-transparent text-white border-2 border-white/30 mt-2 active:scale-95 transition-transform"
        >
          <XCircle className="h-6 w-6" /> I'm Safe (Cancel)
        </button>
      </div>
    </div>
  );
}
