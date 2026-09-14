/**
 * DEPRECATED: Static tours have been completely removed.
 * Firebase Firestore is the single source of truth for all tours across GeorgiaTrips.
 */

import { DESTINATIONS } from "./placesMeta";

export { DESTINATIONS };

export const ALL_TOURS = [];
export const ALL_TOURS_SCHEDULE = [];

export function getTourById() {
  return null;
}

export function getTourSchedule() {
  return [];
}

export function getTourDetails(tour) {
  return tour || null;
}
