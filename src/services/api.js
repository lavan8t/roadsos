import { Hospital, ShieldAlert, Wrench, CarFront, CircleDot, MapPin, Fuel } from "lucide-react";
import { C } from "../constants/theme";

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
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

function getWorkingPhoneNumber(el, category) {
  const tags = el.tags || {};
  const rawPhone = tags.mobile || tags["contact:mobile"] || tags.phone || tags["contact:phone"];

  if (rawPhone) {
    return rawPhone.trim();
  }

  // Fallback to correct emergency numbers if no specific phone is listed
  if (category === "Medical") return "108";
  if (category === "Police") return "112";

  return "N/A";
}

export async function fetchRealNearbyServices(lat, lng, radius = 5000, categoryFilter = null) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn("API paused: Waiting for valid GPS coordinates...");
    return [];
  }

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.warn("Geoapify API key is missing. Please add it to the .env file.");
    return [];
  }

  // Common function to format Geoapify features
  const formatFeatures = (features, currentLat, currentLng) => {
    return features.map((feature) => {
      const props = feature.properties;

      let category = "Mechanic";
      const categories = props.categories || [];
      if (categories.some(c => c.startsWith("healthcare"))) category = "Medical";
      else if (categories.some(c => c.startsWith("service.police"))) category = "Police";
      else if (categories.some(c => c.includes("vehicle.tyre") || c.includes("tyre"))) category = "Puncture Shop";
      else if (categories.some(c => c.includes("vehicle.dealer") || c.includes("showroom"))) category = "Showroom";
      else if (categories.some(c => c.includes("fuel") || c.includes("gas"))) category = "Fuel Station";
      else if (categories.some(c => c.startsWith("populated_place"))) category = "Nearby City";
      else if (categories.some(c => c.includes("vehicle.repair") || c.includes("service.vehicle"))) category = "Mechanic";

      let icon = Hospital;
      let color = C.surfaceContainerHigh;
      let onColor = C.onSurface;

      switch (category) {
        case "Medical": icon = Hospital; color = C.greenContainer; onColor = C.onGreenContainer; break;
        case "Police": icon = ShieldAlert; color = C.blueContainer; onColor = C.onBlueContainer; break;
        case "Puncture Shop": icon = CircleDot; color = "#d97706"; onColor = "#ffffff"; break;
        case "Showroom": icon = CarFront; color = "#b45309"; onColor = "#ffffff"; break;
        case "Fuel Station": icon = Fuel; color = "#be123c"; onColor = "#ffffff"; break;
        case "Nearby City": icon = MapPin; color = "#6b21a8"; onColor = "#ffffff"; break;
        case "Mechanic": icon = Wrench; color = "#b45309"; onColor = "#ffffff"; break;
      }

      const placeLat = props.lat;
      const placeLng = props.lon;

      let phone = props.contact?.phone || "N/A";
      if (phone === "N/A") {
        if (category === "Medical") phone = "108";
        if (category === "Police") phone = "112"; // National Emergency Highway Number
        if (category === "Puncture Shop" || category === "Mechanic" || category === "Showroom") phone = "1033"; // NHAI Highway Helpline
        if (category === "Fuel Station") phone = "N/A"; // No generic fallback for fuel
      }

      return {
        id: props.place_id,
        name: props.name || `Local ${category}`,
        category,
        distance: getDistanceFromLatLonInKm(currentLat, currentLng, placeLat, placeLng) + " km",
        phone,
        verified: !!props.name,
        icon,
        color,
        onColor,
        lat: placeLat,
        lng: placeLng,
        rawDistance: parseFloat(getDistanceFromLatLonInKm(currentLat, currentLng, placeLat, placeLng))
      };
    });
  };

  const processFormattedResults = (formattedResults) => {
    // Sort by distance and return everything (no limits)
    return formattedResults.sort((a, b) => a.rawDistance - b.rawDistance);
  };

  // If we are offline, parse from Route Cache
  if (!navigator.onLine) {
    try {
      console.log("Offline mode: Reading from route cache...");
      const cached = localStorage.getItem("roadsos_cached_pois");
      if (cached) {
        const features = JSON.parse(cached);
        const formatted = formatFeatures(features, lat, lng);
        // Filter out places that are too far away (e.g. > radius in km)
        let localMatches = formatted.filter(f => f.rawDistance <= radiusKm);
        if (categoryFilter) {
          localMatches = localMatches.filter(f => f.category === categoryFilter);
        }
        return processFormattedResults(localMatches);
      }
    } catch (e) {
      console.error("Failed to read route cache", e);
    }
    return [];
  }

  // Map categoryFilter to specific Geoapify categories to preserve the 100 limit for the requested type
  let categoriesToFetch = "healthcare,service.police,service.vehicle,commercial.vehicle,commercial.gas,building.commercial,populated_place";

  if (categoryFilter) {
    switch (categoryFilter) {
      case "Medical": categoriesToFetch = "healthcare"; break;
      case "Police": categoriesToFetch = "service.police,amenity.police"; break;
      case "Puncture Shop": categoriesToFetch = "service.vehicle.tyre,commercial.vehicle.tyre"; break;
      case "Mechanic": categoriesToFetch = "service.vehicle.repair,service.vehicle"; break;
      case "Showroom": categoriesToFetch = "commercial.vehicle.dealer"; break;
      case "Fuel Station": categoriesToFetch = "commercial.gas,commercial.vehicle.fuel,amenity.fuel"; break;
      case "Nearby City": categoriesToFetch = "populated_place"; break;
    }
  }

  // Geoapify requires longitude first for the circle filter
  const url = `https://api.geoapify.com/v2/places?categories=${categoriesToFetch}&filter=circle:${lng},${lat},${radius}&limit=100&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) throw new Error("Geoapify Rate Limit Exceeded");
      throw new Error(`Geoapify API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    let formattedResults = formatFeatures(features, lat, lng);
    if (categoryFilter) {
      formattedResults = formattedResults.filter(f => f.category === categoryFilter);
    }
    return processFormattedResults(formattedResults);

  } catch (error) {
    console.log("[Network] Geoapify fetch failed, falling back to cache.");
    try {
      const cached = localStorage.getItem("roadsos_cached_pois");
      if (cached) {
        const features = JSON.parse(cached);
        const formatted = formatFeatures(features, lat, lng);
        let localMatches = formatted.filter(f => f.rawDistance <= radiusKm);
        if (categoryFilter) {
          localMatches = localMatches.filter(f => f.category === categoryFilter);
        }
        return processFormattedResults(localMatches);
      }
    } catch (e) { }
    return [];
  }
}

export async function cacheRouteAhead(lat, lng) {
  if (!navigator.onLine || !lat || !lng || isNaN(lat) || isNaN(lng)) return;

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!apiKey) return;

  // 50km radius for route-ahead caching
  const CACHE_RADIUS = 50000;
  // Increase limit to 300 to ensure we get a dense map of the 50km area
  const url = `https://api.geoapify.com/v2/places?categories=healthcare,service.police,service.vehicle,commercial.vehicle,commercial.gas,building.commercial,populated_place&filter=circle:${lng},${lat},${CACHE_RADIUS}&limit=300&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const features = data.features || [];
      if (features.length > 0) {
        localStorage.setItem("roadsos_cached_pois", JSON.stringify(features));
        console.log(`[Route Cache] Cached ${features.length} POIs in 50km radius.`);
      }
    }
  } catch (error) {
    // Silently ignore background route cache failures
  }
}

export async function fetchAreaName(lat, lng) {
  if (!navigator.onLine || !lat || !lng || isNaN(lat) || isNaN(lng)) return "GPS Location";

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "RoadSOS-PWA-App",
        },
      }
    );

    if (!res.ok) return "GPS Location";

    const nominatimData = await res.json();
    if (!nominatimData || !nominatimData.address) return "GPS Location";

    const addr = nominatimData.address;

    // Extract road info if available
    const roadRef = addr.road || addr.highway || addr.pedestrian || "";

    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.village ||
      addr.city_district ||
      addr.town ||
      addr.city ||
      addr.county;

    const parent = addr.city || addr.town || addr.state || addr.country;

    let areaDisplay = "";
    if (area && parent && area !== parent) {
      areaDisplay = `${area}, ${parent}`;
    } else {
      areaDisplay = area || parent || nominatimData.display_name || "";
    }

    if (roadRef && areaDisplay && !areaDisplay.startsWith(roadRef)) {
      return `${roadRef}, ${areaDisplay}`;
    }
    return roadRef || areaDisplay || "GPS Location";
  } catch (error) {
    // Suppress network errors
    return "GPS Location";
  }
}

export async function searchDestination(query, currentLat, currentLng) {
  if (!navigator.onLine || !query) return [];
  
  try {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (apiKey) {
      // Use Geoapify Autocomplete
      let geoUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&apiKey=${apiKey}`;
      
      // Bias to current location if available
      if (currentLat && currentLng) {
        geoUrl += `&bias=proximity:${currentLng},${currentLat}`;
      }

      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          return data.features.map(f => {
            const props = f.properties;
            return {
              lat: props.lat,
              lng: props.lon,
              name: props.formatted || props.name || query
            };
          });
        }
      }
    }
  } catch (e) {
    console.warn("Geoapify autocomplete failed, falling back to Nominatim", e);
  }

  // Fallback to Nominatim if Geoapify fails or no key
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

    if (currentLat && currentLng) {
      const viewbox = `${currentLng - 1},${currentLat + 1},${currentLng + 1},${currentLat - 1}`;
      url += `&viewbox=${viewbox}&bounded=0`;
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "RoadSOS-PWA-App" }
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.length > 0) {
      return data.map(item => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.display_name
      }));
    }
    return [];
  } catch (e) {
    // Suppress network errors
    return [];
  }
}

export function triggerEmergencySMS(profile, contacts, location, event = "SOS_TRIGGERED") {
  if (!contacts || contacts.length === 0) return;

  const validContacts = contacts.filter(c => c.phone);
  if (validContacts.length === 0) return;

  const phones = validContacts.map(c => c.phone).join(",");
  const mapUrl = location?.rawLat ? `https://maps.google.com/?q=${location.rawLat},${location.rawLng}` : 'Unknown Location';

  const message = `EMERGENCY ALERT: ${event}
Name: ${profile?.name || 'Unknown'}
Blood Group: ${profile?.bloodGroup || 'Unknown'}
Allergies: ${profile?.allergies || 'None'}
Location: ${mapUrl}`;

  const encodedMsg = encodeURIComponent(message);

  // iOS uses &, Android uses ?
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "&" : "?";

  window.location.href = `sms:${phones}${separator}body=${encodedMsg}`;
}
