import db from "../db/index.js";

export function attachRestaurantBySubdomain(req, res, next) {

  const hostname = req.hostname;

  // Ignore localhost
  if (hostname.includes("localhost")) {
    req.restaurant = db
      .prepare("SELECT * FROM restaurants LIMIT 1")
      .get();
    return next();
  }

  const subdomain = hostname.split(".")[0];

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(subdomain);

  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}