import React from "react";
import { PageHeader } from "../components/Shared";
import { C } from "../constants/theme";

export default function Settings() {
  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{ background: C.bg }}
    >
      <PageHeader title="Settings" />
      <div
        className="flex flex-col gap-4 z-10"
        style={{ animation: "slide-up-md 0.4s ease-out 0.1s both" }}
      >
        <div className="p-5 rounded-3xl bg-[#2b2927] flex items-center justify-between">
          <span className="text-[16px] font-bold text-white">
            Offline Mode Cache
          </span>
          <span className="text-[14px] font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[#2b2927] flex items-center justify-between">
          <span className="text-[16px] font-bold text-white">Region</span>
          <span className="text-[14px] text-[#d0c4b5]">India (112)</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#2b2927] flex items-center justify-between">
          <span className="text-[16px] font-bold text-white">
            Location Services
          </span>
          <span className="text-[14px] text-[#d0c4b5]">Enabled</span>
        </div>
      </div>
    </div>
  );
}
