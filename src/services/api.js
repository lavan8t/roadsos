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

function getWorkingPhoneNumber(el, category) {
  const tags = el.tags || {};
  const rawPhone = tags.mobile || tags["contact:mobile"] || tags.phone || tags["contact:phone"];
  
  if (rawPhone) {
    return rawPhone.trim();
  }
  
  // Fallback to correct emergency numbers if no specific phone is listed
  if (category === "Medical") return "108";
  if (category === "Police") return "100";
  
  return "N/A";
}

export async function fetchRealNearbyServices(lat, lng, radius = 5000) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn("API paused: Waiting for valid GPS coordinates...");
    return [];
  }

  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error("Google Maps Places API is not loaded.");
    return [];
  }

  const location = new window.google.maps.LatLng(lat, lng);
  const service = new window.google.maps.places.PlacesService(document.createElement('div'));

  const fetchPlaces = (type) => {
    return new Promise((resolve) => {
      service.nearbySearch(
        {
          location,
          radius,
          type,
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        }
      );
    });
  };

  const getDetails = (placeId) => {
    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ["formatted_phone_number"],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place.formatted_phone_number);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  try {
    const [hospitals, policeStations, mechanics] = await Promise.all([
      fetchPlaces('hospital'),
      fetchPlaces('police'),
      fetchPlaces('car_repair'),
    ]);

    // Limit to top 3 for each to avoid spamming getDetails
    const topHospitals = hospitals.slice(0, 3);
    const topPolice = policeStations.slice(0, 3);
    const topMechanics = mechanics.slice(0, 3);

    const formatPlace = async (place, category, defaultEmergencyNumber) => {
      let icon = category === "Medical" ? Hospital : category === "Police" ? ShieldAlert : Wrench;
      let color = category === "Medical" ? C.greenContainer : category === "Police" ? C.blueContainer : C.surfaceContainerHigh;
      let onColor = category === "Medical" ? C.onGreenContainer : category === "Police" ? C.onBlueContainer : C.onSurface;

      const placeLat = place.geometry?.location?.lat() || lat;
      const placeLng = place.geometry?.location?.lng() || lng;

      // Fetch phone number
      const phoneStr = await getDetails(place.place_id);

      return {
        id: place.place_id,
        name: place.name || `Local ${category}`,
        category,
        distance: getDistanceFromLatLonInKm(lat, lng, placeLat, placeLng) + " km",
        phone: phoneStr || defaultEmergencyNumber || "N/A",
        verified: true,
        icon,
        color,
        onColor,
        lat: placeLat,
        lng: placeLng,
      };
    };

    const formattedPromises = [
      ...topHospitals.map(p => formatPlace(p, "Medical", "108")),
      ...topPolice.map(p => formatPlace(p, "Police", "100")),
      ...topMechanics.map(p => formatPlace(p, "Mechanic", null)),
    ];

    const results = await Promise.all(formattedPromises);
    return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  } catch (error) {
    console.error("Google Places Fetch Failed:", error);
    return [];
  }
}

async function getNearestRoadRef(lat, lng) {
  const query = `[out:json][timeout:5];way[highway](around:300,${lat},${lng});out tags 5;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.elements) {
        let bestRoadRef = "";
        let bestRoadName = "";

        // Scan for highways prioritizing NH, SH, MDR
        for (const element of data.elements) {
          if (element.tags) {
            const ref = element.tags.ref;
            const name = element.tags.name;
            if (ref) {
              const upperRef = ref.toUpperCase().replace(/\s+/g, "");
              if (
                upperRef.startsWith("NH") ||
                upperRef.startsWith("SH") ||
                upperRef.startsWith("MDR")
              ) {
                bestRoadRef = ref;
                bestRoadName = name || "";
                break; // Found priority road ref!
              } else if (!bestRoadRef) {
                bestRoadRef = ref; // general road number fallback
                bestRoadName = name || "";
              }
            } else if (name && !bestRoadName) {
              bestRoadName = name;
            }
          }
        }

        if (bestRoadRef) {
          if (bestRoadName) return `${bestRoadRef} (${bestRoadName})`;
          return bestRoadRef;
        }
        if (bestRoadName) return bestRoadName;
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve nearest road ref:", err);
  }
  return null;
}

export async function fetchAreaName(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

  // Fetch general area and nearest road ref in parallel
  const areaPromise = fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "RoadSOS-PWA-App",
      },
    },
  )
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

  const roadPromise = getNearestRoadRef(lat, lng);

  try {
    const [nominatimData, roadRef] = await Promise.all([
      areaPromise,
      roadPromise,
    ]);

    let areaDisplay = "";
    if (nominatimData && nominatimData.address) {
      const addr = nominatimData.address;
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.city_district ||
        addr.town ||
        addr.city ||
        addr.county;
      const parent = addr.city || addr.town || addr.state || addr.country;

      if (area && parent && area !== parent) {
        areaDisplay = `${area}, ${parent}`;
      } else {
        areaDisplay = area || parent || nominatimData.display_name || "";
      }
    }

    if (roadRef && areaDisplay) {
      return `${roadRef}, ${areaDisplay}`;
    }
    return roadRef || areaDisplay || "GPS Location";
  } catch (error) {
    console.error("Failed to reverse geocode location:", error);
  }
  return null;
}
