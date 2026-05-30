import { useState, useEffect, useCallback } from "react";
import { fetchAreaName } from "../services/api";

export function useAppStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem("roadsos_onboarded") === "true",
  );

  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    name: "Waiting for location...",
    status: "pending",
    rawLat: null,
    rawLng: null,
  });

  const [watchId, setWatchId] = useState(null);

  const fetchLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocation((prev) => ({
        ...prev,
        status: "error",
        name: "GPS Not Supported",
      }));
      return;
    }

    setLocation((prev) => ({
      ...prev,
      status: "pending",
      name: "Locating...",
    }));

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const latVal = pos.coords.latitude;
        const lngVal = pos.coords.longitude;

        setLocation((prev) => ({
          ...prev,
          lat: latVal.toFixed(4),
          lng: lngVal.toFixed(4),
          status: "success",
          rawLat: latVal,
          rawLng: lngVal,
        }));

        // Fetch area name
        fetchAreaName(latVal, lngVal).then((areaName) => {
          setLocation((prev) => ({
            ...prev,
            name: areaName || "GPS Location",
          }));
        });
      },
      (err) => {
        console.warn("Geolocation Error:", err.message);
        let newStatus = "error";
        let newName = "Location Unavailable";

        if (err.code === err.PERMISSION_DENIED) {
          newStatus = "denied";
          newName = "Location Permission Denied";
        }

        setLocation((prev) => ({
          ...prev,
          status: newStatus,
          name: newName,
        }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );

    setWatchId((oldId) => {
      if (oldId !== null) navigator.geolocation.clearWatch(oldId);
      return id;
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (onboardingComplete) {
      fetchLocation();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onboardingComplete, fetchLocation]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const finishOnboarding = () => {
    localStorage.setItem("roadsos_onboarded", "true");
    setOnboardingComplete(true);
    fetchLocation();
  };

  return {
    isOnline,
    location,
    onboardingComplete,
    finishOnboarding,
    fetchLocation,
  };
}
