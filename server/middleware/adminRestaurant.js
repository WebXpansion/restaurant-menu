import db from "../db/index.js";

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

  restaurant.features = restaurant.features
    ? JSON.parse(restaurant.features)
    : {};

  req.restaurant = restaurant;
  res.locals.restaurant = restaurant;

  next();
}