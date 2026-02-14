import db from "../db/index.js";
import { resolveRestaurantPlan } from "../services/restaurantPlan.js";

export function attachRestaurant(req, res, next) {

  const hostname = req.hostname;
  let slug;

  /* =========================
     LOCAL DEV
  ========================= */
  if (hostname.includes("localhost")) {
    slug = "demo";
  }

  /* =========================
     PRODUCTION
     menu.lerefuge.com
  ========================= */
  else {
    const parts = hostname.split(".");

    if (parts.length < 3) {
      return res.status(400).send("Invalid domain structure");
    }

    slug = parts[1];
  }

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(slug);

  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  // ✅ PLAN RESOLUTION CENTRALISÉE
  resolveRestaurantPlan(restaurant);

  // Si encore JSON menus
  restaurant.menus = restaurant.menus
    ? JSON.parse(restaurant.menus)
    : [];

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}