import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppStatus } from "./hooks/useAppStatus";

// Pages
import Home from "./pages/Home";
import NearbyHelp from "./pages/NearbyHelp";
import SosFlow from "./pages/SosFlow"; // Extract this from the previous App.jsx
import ReportIncident from "./pages/ReportIncident"; // Extract this from the previous App.jsx
import Settings from "./pages/Settings"; // Extract this from the previous App.jsx

export default function App() {
  const status = useAppStatus();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home status={status} />} />
        <Route path="/sos" element={<SosFlow location={status.location} />} />
        <Route
          path="/help"
          element={<NearbyHelp location={status.location} />}
        />
        <Route
          path="/report"
          element={<ReportIncident location={status.location} />}
        />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
