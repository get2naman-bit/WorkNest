// Mumbai geography + pay helpers used by the Find Jobs map and sorting.
//
// Jobs don't need stored coordinates: a job's `location` text (e.g.
// "Colaba, Mumbai (On-site)") is matched against the neighbourhoods below.
// A job may also carry explicit `lat` / `lng` fields, which take priority.

// Reference point for "nearest first": Fort (Horniman Circle), South Mumbai.
export const FORT_ORIGIN = { name: 'Fort', lat: 18.9322, lng: 72.8347 };

// Visible map window (South + Central Mumbai).
export const MAP_BOUNDS = { minLat: 18.895, maxLat: 19.035, minLng: 72.79, maxLng: 72.895 };

export const MUMBAI_AREAS = [
  { name: 'Fort', lat: 18.9322, lng: 72.8347 },
  { name: 'Kala Ghoda', lat: 18.9286, lng: 72.8312 },
  { name: 'Ballard Estate', lat: 18.9345, lng: 72.8402 },
  { name: 'CSMT', lat: 18.9398, lng: 72.8355 },
  { name: 'Churchgate', lat: 18.9322, lng: 72.8264 },
  { name: 'Nariman Point', lat: 18.9256, lng: 72.8244 },
  { name: 'Cuffe Parade', lat: 18.9120, lng: 72.8210 },
  { name: 'Colaba', lat: 18.915, lng: 72.824 },
  { name: 'Marine Lines', lat: 18.943, lng: 72.823 },
  { name: 'Crawford Market', lat: 18.9473, lng: 72.834 },
  { name: 'Masjid Bunder', lat: 18.9485, lng: 72.8387 },
  { name: 'Girgaon', lat: 18.9545, lng: 72.813 },
  { name: 'Malabar Hill', lat: 18.9548, lng: 72.7956 },
  { name: 'Grant Road', lat: 18.963, lng: 72.815 },
  { name: 'Mumbai Central', lat: 18.969, lng: 72.8205 },
  { name: 'Mazagaon', lat: 18.968, lng: 72.844 },
  { name: 'Byculla', lat: 18.976, lng: 72.833 },
  { name: 'Mahalaxmi', lat: 18.983, lng: 72.823 },
  { name: 'Lower Parel', lat: 18.993, lng: 72.83 },
  { name: 'Parel', lat: 18.9966, lng: 72.84 },
  { name: 'Sewri', lat: 19.0, lng: 72.857 },
  { name: 'Prabhadevi', lat: 19.013, lng: 72.827 },
  { name: 'Worli', lat: 19.0176, lng: 72.818 },
  { name: 'Dadar', lat: 19.0178, lng: 72.8478 },
];

// Longest names first so "Marine Lines" can't be shadowed by a shorter match.
const AREAS_BY_NAME_LENGTH = [...MUMBAI_AREAS].sort((a, b) => b.name.length - a.name.length);

export function findArea(text = '') {
  const haystack = String(text);
  return (
    AREAS_BY_NAME_LENGTH.find((a) => new RegExp(`\\b${a.name}\\b`, 'i').test(haystack)) || null
  );
}

// Returns { lat, lng, area } for a job, or null if it can't be placed on the map.
export function resolveJobCoords(job) {
  if (!job) return null;
  if (Number.isFinite(job.lat) && Number.isFinite(job.lng)) {
    return { lat: job.lat, lng: job.lng, area: findArea(job.location)?.name || null };
  }
  const area = findArea(job.location);
  return area ? { lat: area.lat, lng: area.lng, area: area.name } : null;
}

const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance in km.
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return '';
  if (km < 0.1) return '< 100 m';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Project lat/lng into an SVG viewBox of the given size.
export function project({ lat, lng }, width, height) {
  const { minLat, maxLat, minLng, maxLng } = MAP_BOUNDS;
  return {
    x: ((lng - minLng) / (maxLng - minLng)) * width,
    y: ((maxLat - lat) / (maxLat - minLat)) * height,
  };
}

// ---------- Pay ----------

// Indian digit grouping, e.g. 4500000 -> "₹45,00,000".
export function formatINR(amount) {
  if (!Number.isFinite(amount)) return '';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function firstNumber(text = '') {
  const match = String(text).replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

// "Half day" -> 0.5, "2 - 3 days" -> 2.5, "1.5 weeks" -> 9 (6 working days/week)
export function durationInDays(duration = '') {
  const text = String(duration).toLowerCase();
  if (text.includes('half')) return 0.5;
  const nums = (text.replace(/,/g, '').match(/\d+(\.\d+)?/g) || []).map(parseFloat);
  if (nums.length === 0) return 1;
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  if (text.includes('week')) return avg * 6;
  return avg;
}

export function isHourly(job) {
  return (job.payType || '').toLowerCase() === 'hourly' || /\/\s*hr/i.test(job.payRate || '');
}

// Comparable total (INR) used for "sort by pay". Fixed jobs use the posted
// amount; hourly jobs are estimated as rate x 8 hrs x duration in days.
export function estimatedTotalPay(job) {
  const amount = firstNumber(job.payRate);
  if (amount == null) return null;
  return isHourly(job) ? amount * 8 * durationInDays(job.duration) : amount;
}
