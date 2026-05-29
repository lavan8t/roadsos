import { Hospital, ShieldAlert, Wrench } from "lucide-react";
import { C } from "../constants/theme";

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export async function fetchRealNearbyServices(lat, lng, radius = 8000) {
  // 1. STRICT SAFETY CHECK: Prevent the API from crashing on bad data
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn("API paused: Waiting for valid GPS coordinates...");
    return [];
  }

  // 2. The Query
  const query = `[out:json][timeout:15];
(
  nwr["amenity"="hospital"](around:${radius},${lat},${lng});
  nwr["amenity"="clinic"](around:${radius},${lat},${lng});
  nwr["amenity"="police"](around:${radius},${lat},${lng});
  nwr["shop"="car_repair"](around:${radius},${lat},${lng});
);
out center 15;`;

  try {
    // 3. THE FIX: Send a raw POST request with NO custom headers.
    // This bypasses the strict CORS preflight and prevents the 406 error.
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    return data.elements
      .map((el) => {
        const isMedical =
          el.tags?.amenity === "hospital" || el.tags?.amenity === "clinic";
        const isPolice = el.tags?.amenity === "police";

        let category = isMedical ? "Medical" : isPolice ? "Police" : "Mechanic";
        let icon = isMedical ? Hospital : isPolice ? ShieldAlert : Wrench;
        let color = isMedical
          ? C.greenContainer
          : isPolice
            ? C.blueContainer
            : C.surfaceContainerHigh;
        let onColor = isMedical
          ? C.onGreenContainer
          : isPolice
            ? C.onBlueContainer
            : C.onSurface;

        const elLat = el.lat || el.center?.lat;
        const elLng = el.lon || el.center?.lon;

        return {
          id: el.id,
          name: el.tags?.name || `Local ${category}`,
          category,
          distance: getDistanceFromLatLonInKm(lat, lng, elLat, elLng) + " km",
          phone:
            el.tags?.phone || (isMedical ? "108" : isPolice ? "100" : "N/A"),
          verified: !!el.tags?.name,
          icon,
          color,
          onColor,
          lat: elLat,
          lng: elLng,
        };
      })
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  } catch (error) {
    console.error("Fetch Failed. The Overpass server might be busy:", error);
    return [];
  }
}
