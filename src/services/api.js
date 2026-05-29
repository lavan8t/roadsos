import { Hospital, ShieldAlert, Wrench, AlertCircle } from "lucide-react";
import { C } from "../constants/theme";

// Calculate distance using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
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

// Fetch real nearby services using OpenStreetMap Overpass API
export async function fetchRealNearbyServices(lat, lng, radius = 5000) {
  // Query OSM for hospitals, police, and mechanics within 'radius' meters
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      node["shop"="car_repair"](around:${radius},${lat},${lng});
    );
    out body 15;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter`, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();

    // Map OSM data to our App's standard format
    return data.elements
      .map((el) => {
        const isHospital = el.tags?.amenity === "hospital";
        const isPolice = el.tags?.amenity === "police";

        let category = isHospital
          ? "Hospital"
          : isPolice
            ? "Police"
            : "Mechanic";
        let icon = isHospital ? Hospital : isPolice ? ShieldAlert : Wrench;
        let color = isHospital
          ? C.greenContainer
          : isPolice
            ? C.blueContainer
            : C.surfaceContainerHigh;
        let onColor = isHospital
          ? C.onGreenContainer
          : isPolice
            ? C.onBlueContainer
            : C.onSurface;

        return {
          id: el.id,
          name: el.tags?.name || `Local ${category}`,
          category,
          distance: getDistanceFromLatLonInKm(lat, lng, el.lat, el.lon) + " km",
          phone:
            el.tags?.phone || (isHospital ? "108" : isPolice ? "100" : "N/A"),
          verified: !!el.tags?.name,
          icon,
          color,
          onColor,
          lat: el.lat,
          lng: el.lon,
        };
      })
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); // Sort by closest
  } catch (error) {
    console.error("Failed to fetch nearby places:", error);
    return []; // Return empty array to fallback to UI empty states
  }
}
