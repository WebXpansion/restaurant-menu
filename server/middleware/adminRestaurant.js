import { getPool } from "../db/postgres.js";
import { resolveRestaurantPlan } from "../services/restaurantPlan.js";

export async function requireAdminRestaurant(req, res, next) {

  if (!req.session.user) {
    return res.redirect("/admin/login");
  }

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT * FROM restaurants WHERE id = $1`,
    [req.session.user.restaurant_id]
  );

  const restaurant = rows[0];

  if (!restaurant) {
    return res.status(403).send("Restaurant not found");
  }

  resolveRestaurantPlan(restaurant);

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}