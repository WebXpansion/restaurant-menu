import db from "../db/index.js";

export function attachRestaurant(req, res, next) {

  const hostname = req.hostname;

  let slug;

  // ===== LOCAL DEV =====
  // demo.localhost:3000
  if (hostname.includes("localhost")) {

    const parts = hostname.split(".");
    slug = parts.length > 1 ? parts[0] : null;

    // Si pas de sous-domaine → fallback demo
    if (!slug || slug === "localhost") {
      slug = "demo";
    }

  } else {

    // ===== PRODUCTION =====
    // demo.monsaas.com
    slug = hostname.split(".")[0];

  }

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(slug);

  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  try {
    restaurant.features = restaurant.features
      ? JSON.parse(restaurant.features)
      : {};
  } catch {
    restaurant.features = {};
  }

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}