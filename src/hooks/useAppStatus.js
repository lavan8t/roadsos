import { useState, useEffect } from "react";

export function useAppStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Defaulting to a central India coordinate if nothing is found,
  // but will immediately try to get real device GPS
  const [location, setLocation] = useState({
    lat: 20.5937,
    lng: 78.9629,
    name: "Locating...",
    cached: true,
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
