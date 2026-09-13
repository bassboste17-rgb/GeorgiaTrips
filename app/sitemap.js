import { getCachedTours, getCachedPlaces } from "./lib/server/cachedData";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";

const STATIC_RELEASE_DATE = new Date("2026-09-01T00:00:00.000Z");

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/tours", priority: 0.95, changeFrequency: "daily" },
  { path: "/places", priority: 0.85, changeFrequency: "weekly" },
  { path: "/hotels", priority: 0.85, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.9, changeFrequency: "weekly" },
  { path: "/posts", priority: 0.8, changeFrequency: "daily" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
];

function parseContentDate(rawDate) {
  if (!rawDate) return STATIC_RELEASE_DATE;
  if (rawDate instanceof Date) return rawDate;
  if (typeof rawDate === "number") return new Date(rawDate);
  if (typeof rawDate === "string") {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return STATIC_RELEASE_DATE;
}

export default async function sitemap() {
  const entries = [];

  // Helper to push all multilingual versions of a route with a stable date
  const addLocalizedEntries = (routePath, priority, changeFrequency, lastModified = STATIC_RELEASE_DATE) => {
    const alternates = { languages: getAlternateLanguages(routePath) };
    for (const lang of SUPPORTED_LANGUAGES) {
      const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
      const url = `${SITE_URL}/${lang}${routePath === "" ? "" : cleanRoute}`;
      entries.push({
        url,
        lastModified,
        changeFrequency,
        priority,
        alternates,
      });
    }
  };

  // 1. Static Pages across all supported languages (with stable release date)
  for (const { path: route, priority, changeFrequency } of STATIC_ROUTES) {
    addLocalizedEntries(route, priority, changeFrequency, STATIC_RELEASE_DATE);
  }

  // 2. Published Real Tours across all supported languages (with real content update dates)
  try {
    const allTours = (await getCachedTours()) || [];
    const seenTourIds = new Set();

    for (const tour of allTours) {
      if (!tour?.id || seenTourIds.has(tour.id)) continue;
      seenTourIds.add(tour.id);
      const tourDate = parseContentDate(tour.updatedAt || tour.createdAt);
      addLocalizedEntries(`/tours/${encodeURIComponent(tour.id)}`, 0.9, "daily", tourDate);
    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places across all supported languages (with real content update dates)
  try {
    const places = (await getCachedPlaces()) || [];
    const seenPlaceIds = new Set();

    for (const place of places) {
      if (!place?.id || seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);
      const placeDate = parseContentDate(place.updatedAt || place.createdAt);
      addLocalizedEntries(`/places/${encodeURIComponent(place.id)}`, 0.75, "weekly", placeDate);
    }
  } catch (err) {
    console.error("Sitemap places error:", err);
  }

  return entries;
}
