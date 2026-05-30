import { useState, useEffect, useRef } from "react";
import { getDistanceFromLatLonInKm } from "../services/api";

const SPEEDS = {
  Walking: 5,
  Bike: 15,
  Bus: 30,
  Car: 45,
  Train: 60,
};

export function useJourney(location) {
  const [activeJourney, setActiveJourney] = useState(null);
  const [journeyHistory, setJourneyHistory] = useState([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const timerRef = useRef(null);
  const promptTimeoutRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("roadsos_journey");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.status === "active") {
          setActiveJourney(parsed);
        }
      }
      const history = localStorage.getItem("roadsos_journey_history");
      if (history) setJourneyHistory(JSON.parse(history));
    } catch (e) {
      console.error("Failed to parse journey data", e);
    }
  }, []);

  // Save active journey
  const persistJourney = (journey) => {
    if (journey) {
      localStorage.setItem("roadsos_journey", JSON.stringify(journey));
    } else {
      localStorage.removeItem("roadsos_journey");
    }
    setActiveJourney(journey);
  };

  const startJourney = (destination, destLat, destLng, mode, notes) => {
    if (!location || !location.rawLat) return;
    
    const distanceKm = getDistanceFromLatLonInKm(location.rawLat, location.rawLng, destLat, destLng);
    const speed = SPEEDS[mode] || 45;
    const durationHours = parseFloat(distanceKm) / speed;
    const durationMs = durationHours * 60 * 60 * 1000;
    
    const now = Date.now();
    const eta = now + durationMs;

    const journey = {
      id: "jrn_" + now,
      status: "active",
      destination,
      destLat,
      destLng,
      mode,
      notes,
      startLat: location.rawLat,
      startLng: location.rawLng,
      startTime: now,
      distanceKm: parseFloat(distanceKm).toFixed(1),
      initialEta: eta,
      currentEta: eta,
      timeline: [
        { time: now, lat: location.rawLat, lng: location.rawLng, label: "Started" }
      ]
    };

    persistJourney(journey);
  };

  const endJourney = (status = "completed") => {
    if (!activeJourney) return;
    const completed = {
      ...activeJourney,
      status,
      endTime: Date.now()
    };
    
    const newHistory = [completed, ...journeyHistory].slice(0, 10);
    setJourneyHistory(newHistory);
    localStorage.setItem("roadsos_journey_history", JSON.stringify(newHistory));
    
    persistJourney(null);
    setShowVerificationModal(false);
  };

  const extendJourney = (minutes = 15) => {
    if (!activeJourney) return;
    const updated = {
      ...activeJourney,
      currentEta: activeJourney.currentEta + (minutes * 60 * 1000)
    };
    persistJourney(updated);
    setShowVerificationModal(false);
  };

  // Background Monitoring
  useEffect(() => {
    if (!activeJourney || activeJourney.status !== "active") return;

    // Check ETA every 10 seconds
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (now > activeJourney.currentEta && !showVerificationModal) {
        setShowVerificationModal(true);
      }
    }, 10000);

    // Drop breadcrumbs every 5 mins
    trackingIntervalRef.current = setInterval(() => {
      if (location && location.rawLat && activeJourney) {
        setActiveJourney(prev => {
          if (!prev) return prev;
          const newTimeline = [...prev.timeline, {
            time: Date.now(),
            lat: location.rawLat,
            lng: location.rawLng,
            label: "En Route"
          }];
          const updated = { ...prev, timeline: newTimeline };
          localStorage.setItem("roadsos_journey", JSON.stringify(updated));
          return updated;
        });
      }
    }, 5 * 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, [activeJourney, showVerificationModal, location]);

  return {
    activeJourney,
    journeyHistory,
    showVerificationModal,
    setShowVerificationModal,
    startJourney,
    endJourney,
    extendJourney
  };
}
