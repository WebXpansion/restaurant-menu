import { getPool } from "../db/postgres.js";

export async function canEnableAR(restaurantId, maxAllowed) {

  // illimité si null ou undefined
  if (maxAllowed == null) {
    return true;
  }

  const pool = getPool();

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM dishes
      WHERE restaurant_id = $1
        AND has_ar = true
        AND status = 'published'
    `,
    [restaurantId]
  );

  const currentCount = rows[0]?.total ?? 0;

  return currentCount < maxAllowed;
}