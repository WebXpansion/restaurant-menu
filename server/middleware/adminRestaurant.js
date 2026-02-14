import db from "../db/index.js";
import { resolveRestaurantPlan } from "../services/restaurantPlan.js";

export function requireAdminRestaurant(req, res, next) {

  if (!req.session.user) {
    return res.redirect("/admin/login");
  }

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE id = ?")
    .get(req.session.user.restaurant_id);

  if (!restaurant) {
    return res.status(403).send("Restaurant not found");
  }

  // ✅ Source unique de vérité
  resolveRestaurantPlan(restaurant);

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}