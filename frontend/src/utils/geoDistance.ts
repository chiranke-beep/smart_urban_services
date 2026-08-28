/**
 * Sri Lankan Urban Infrastructure Geospatial & Haversine Distance Engine
 * Computes exact spherical great-circle distances and predictive arrival times (ETA).
 */

export const SRI_LANKA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Central Province (Kandy & Suburbs)
  "Heerassagala": { lat: 7.2715, lng: 80.6120 },
  "Kandy": { lat: 7.2906, lng: 80.6337 },
  "Kandy Town": { lat: 7.2906, lng: 80.6337 },
  "Kandy twown": { lat: 7.2906, lng: 80.6337 },
  "Kadugannawa": { lat: 7.2562, lng: 80.5218 },
  "Peradeniya": { lat: 7.2600, lng: 80.5950 },
  "Katugastota": { lat: 7.3242, lng: 80.6200 },
  "Gampola": { lat: 7.1644, lng: 80.5764 },
  "Kundasale": { lat: 7.2880, lng: 80.6860 },
  "Digana": { lat: 7.2980, lng: 80.7420 },
  "Matale": { lat: 7.4675, lng: 80.6234 },
  "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },

  // Western Province (Colombo, Gampaha, Kalutara)
  "Colombo": { lat: 6.9271, lng: 79.8612 },
  "Colombo Urban": { lat: 6.9271, lng: 79.8612 },
  "Maharagama": { lat: 6.8480, lng: 79.9260 },
  "Nugegoda": { lat: 6.8649, lng: 79.8997 },
  "Dehiwala": { lat: 6.8511, lng: 79.8659 },
  "Mount Lavinia": { lat: 6.8380, lng: 79.8650 },
  "Moratuwa": { lat: 6.7730, lng: 79.8816 },
  "Kottawa": { lat: 6.8410, lng: 79.9650 },
  "Pannipitiya": { lat: 6.8450, lng: 79.9550 },
  "Boralesgamuwa": { lat: 6.8460, lng: 79.9050 },
  "Homagama": { lat: 6.8420, lng: 80.0030 },
  "Battaramulla": { lat: 6.8980, lng: 79.9180 },
  "Malabe": { lat: 6.9040, lng: 79.9540 },
  "Kaduwela": { lat: 6.9340, lng: 79.9830 },
  "Gampaha": { lat: 7.0840, lng: 79.9943 },
  "Negombo": { lat: 7.2008, lng: 79.8736 },
  "Kelaniya": { lat: 6.9550, lng: 79.9220 },
  "Kalutara": { lat: 6.5854, lng: 79.9607 },
  "Panadura": { lat: 6.7130, lng: 79.9070 },

  // Southern Province
  "Galle": { lat: 6.0535, lng: 80.2210 },
  "Matara": { lat: 5.9549, lng: 80.5550 },

  // North Western & North Central
  "Kurunegala": { lat: 7.4863, lng: 80.3623 },
  "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
  "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },

  // Northern & Eastern
  "Jaffna": { lat: 9.6615, lng: 80.0255 },
  "Batticaloa": { lat: 7.7310, lng: 81.6747 },
  "Trincomalee": { lat: 8.5874, lng: 81.2152 },

  // Uva & Sabaragamuwa
  "Badulla": { lat: 6.9934, lng: 81.0550 },
  "Bandarawela": { lat: 6.8333, lng: 80.9833 },
  "Ratnapura": { lat: 6.6828, lng: 80.3992 },
  "Kegalle": { lat: 7.2513, lng: 80.3464 },
};

/**
 * Calculates Haversine Great-Circle spherical distance between two coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(1));
}

/**
 * Resolves coordinates for a Sri Lankan locality or district name.
 */
export function getCoordinatesForPlace(placeName?: string, fallbackDistrict?: string): { lat: number; lng: number } {
  const clean = (placeName || "").trim().toLowerCase();
  const cleanDistrict = (fallbackDistrict || "").trim().toLowerCase();

  // 1. Direct exact match for locality (case-insensitive)
  for (const [key, coords] of Object.entries(SRI_LANKA_COORDINATES)) {
    if (key.toLowerCase() === clean) {
      return coords;
    }
  }

  // 2. Direct exact match for district
  for (const [key, coords] of Object.entries(SRI_LANKA_COORDINATES)) {
    if (key.toLowerCase() === cleanDistrict) {
      return coords;
    }
  }

  // 3. Substring match on locality (ignoring short generic words like 'town', 'city')
  const genericWords = ["town", "city", "area", "street", "road", "main", "urban", "rd", "st"];
  if (clean && !genericWords.includes(clean) && clean.length > 3) {
    for (const [key, coords] of Object.entries(SRI_LANKA_COORDINATES)) {
      if (clean.includes(key.toLowerCase())) {
        return coords;
      }
    }
  }

  // 4. District keyword match
  if (cleanDistrict) {
    for (const [key, coords] of Object.entries(SRI_LANKA_COORDINATES)) {
      if (cleanDistrict.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanDistrict)) {
        return coords;
      }
    }
  }

  return { lat: 6.9271, lng: 79.8612 }; // Default Colombo
}

/**
 * Calculates accurate AI Distance and Arrival ETA between a worker and job.
 */
export function getAiDistanceAndEta(
  jobLocation: { lat?: number; lng?: number; locality?: string; district?: string },
  providerLocation: { lat?: number; lng?: number; locality?: string; district?: string }
): { distanceKm: number; etaMinutes: number; distanceLabel: string } {
  const jobCoords = (jobLocation.locality || jobLocation.district)
    ? getCoordinatesForPlace(jobLocation.locality, jobLocation.district)
    : (jobLocation.lat && jobLocation.lng ? { lat: jobLocation.lat, lng: jobLocation.lng } : { lat: 6.9271, lng: 79.8612 });

  const provCoords = (providerLocation.locality || providerLocation.district)
    ? getCoordinatesForPlace(providerLocation.locality, providerLocation.district)
    : (providerLocation.lat && providerLocation.lng ? { lat: providerLocation.lat, lng: providerLocation.lng } : { lat: 6.9271, lng: 79.8612 });

  const distanceKm = calculateHaversineDistanceKm(
    provCoords.lat,
    provCoords.lng,
    jobCoords.lat,
    jobCoords.lng
  );

  // Speed: ~25 km/h urban velocity + 5 mins preparation buffer
  const etaMinutes = Math.max(5, Math.round((distanceKm / 25.0) * 60 + 5));

  return {
    distanceKm,
    etaMinutes,
    distanceLabel: distanceKm < 1 ? `~${Math.round(distanceKm * 1000)}m away` : `~${distanceKm} km away`,
  };
}
