import db from "../db/index.js";

export function canEnableAR(restaurantId, maxAllowed) {
  if (maxAllowed === null) return true; // illimité

  const count = db.prepare(`
    SELECT COUNT(*) as total
    FROM dishes
    WHERE restaurant_id = ?
      AND has_ar = 1
  `).get(restaurantId).total;

  return count < maxAllowed;
}
