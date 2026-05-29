import { Hospital, ShieldAlert, Wrench } from "lucide-react";
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
export async function fetchRealNearbyServices(lat, lng, radius = 8000) {
  // Expanded to 8km
  // 'nwr' catches Nodes, Ways (buildings), and Relations (campuses)
  // 'out center' ensures we get a single lat/lng point even for large buildings
  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"="hospital"](around:${radius},${lat},${lng});
      nwr["amenity"="clinic"](around:${radius},${lat},${lng});
      nwr["amenity"="police"](around:${radius},${lat},${lng});
      nwr["shop"="car_repair"](around:${radius},${lat},${lng});
    );
    out center 15;
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

        // Extract coordinates (Nodes use el.lat/lon, Ways/Relations use el.center.lat/lon)
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
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); // Sort by closest
  } catch (error) {
    console.error("Failed to fetch nearby places:", error);
    return [];
  }
}
