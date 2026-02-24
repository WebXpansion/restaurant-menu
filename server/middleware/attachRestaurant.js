import { getPool } from "../db/postgres.js";
import { resolveRestaurantPlan } from "../services/restaurantPlan.js";

export async function attachRestaurant(req, res, next) {

  const hostname = req.hostname;
  let slug;

  /* =========================
     LOCAL DEV
  ========================= */
  if (hostname.includes("localhost")) {
    slug = "test"; // ⚠️ doit correspondre au slug créé en base Postgres
  }

  /* =========================
     PRODUCTION
     slug.plateview.fr
  ========================= */
  else {
    const parts = hostname.split(".");

    if (parts.length < 3) {
      return res.status(400).send("Invalid domain structure");
    }

    slug = parts[0]; // ex: refuge.plateview.fr → refuge
  }

  try {
    const pool = getPool();

    console.log("HOSTNAME:", req.hostname);
console.log("SLUG USED:", slug);

    const { rows } = await pool.query(
      `SELECT * FROM restaurants WHERE slug = $1`,
      [slug]
    );

    const restaurant = rows[0];

    if (!restaurant) {
      return res.status(404).send("Restaurant not found");
    }

    // PLAN RESOLUTION
    resolveRestaurantPlan(restaurant);

    req.restaurant = restaurant;
    res.locals.restaurant = restaurant;

    next();

  } catch (error) {
    console.error("AttachRestaurant error:", error);
    res.status(500).send("Server error");
  }
}