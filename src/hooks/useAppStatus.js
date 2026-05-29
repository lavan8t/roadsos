import { useState, useEffect } from "react";

export function useAppStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Added rawLat and rawLng here so the Nearby API ALWAYS has data to fetch.
  // Defaulted to Tiruppur, TN coordinates.
  const [location, setLocation] = useState({
    lat: 11.1085,
    lng: 77.3411,
    name: "Locating...",
    cached: true,
    rawLat: 11.1085,
    rawLng: 77.3411,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
            name: "Current GPS Location",
            cached: false,
            rawLat: lat,
            rawLng: lng,
          });
        },
        (err) => console.warn("Geolocation failed, using fallback."),
      );
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, location };
}
