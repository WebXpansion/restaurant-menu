import db from "../db/index.js";

export function canEnableAR(restaurantId, maxAllowed) {

  // illimité si null ou undefined
  if (maxAllowed == null) {
    return true;
  }

  const row = db.prepare(`
    SELECT COUNT(*) as total
    FROM dishes
    WHERE restaurant_id = ?
      AND has_ar = 1
  `).get(restaurantId);

  const currentCount = row?.total ?? 0;

  return currentCount < maxAllowed;
}