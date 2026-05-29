import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Check } from "lucide-react";
import { PageHeader } from "../components/Shared";
import { C } from "../constants/theme";

const INCIDENT_TYPES = [
  "Road Accident",
  "Vehicle Breakdown",
  "Medical Emergency",
  "Traffic Hazard",
  "Suspicious Activity",
  "Need Towing",
];

export default function ReportIncident({ location }) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: C.bg }}
      >
        <div className="h-24 w-24 rounded-full bg-green-900 text-green-300 flex items-center justify-center mb-6">
          <Check className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Report Sent</h2>
        <p className="text-[#d0c4b5] mb-8">
          Authorities have been notified of your location.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full max-w-xs py-4 rounded-full font-bold bg-[#363431] text-white active:scale-95 transition-transform border-none outline-none"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{ background: C.bg }}
    >
      <PageHeader title="Report Incident" />
      <div
        className="flex-1 flex flex-col gap-6 z-10"
        style={{ animation: "slide-up-md 0.4s ease-out 0.1s both" }}
      >
        <div>
          <label
            className="text-[14px] font-bold mb-3 block"
            style={{ color: C.onSurfaceVariant }}
          >
            1. What happened?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-3 rounded-2xl text-[14px] font-bold border-2 text-left transition-colors cursor-pointer outline-none ${
                  selectedType === type
                    ? "border-[#ffb4ab] bg-[#690005] text-white"
                    : "border-transparent bg-[#2b2927] text-[#eae0d4]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            className="text-[14px] font-bold mb-3 block"
            style={{ color: C.onSurfaceVariant }}
          >
            2. Location Attached
          </label>
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#2b2927]">
            <MapPin className="h-5 w-5 text-[#ffb4ab]" />
            <span className="text-[14px] text-[#eae0d4]">
              {location?.lat || "Unknown"}, {location?.lng || "Unknown"}
            </span>
          </div>
        </div>

        <div className="mt-auto pb-6">
          <button
            disabled={!selectedType}
            onClick={() => setSubmitted(true)}
            className="w-full h-14 rounded-full text-[18px] font-bold text-black bg-[#ffb4ab] disabled:opacity-50 disabled:bg-[#363431] disabled:text-[#d0c4b5] transition-all cursor-pointer border-none outline-none"
          >
            Send Alert
          </button>
        </div>
      </div>
    </div>
  );
}
