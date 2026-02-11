import db from "../db/index.js";

export function restaurantContext(req, res, next) {
  const { slug } = req.params;
  if (!slug) return next();

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug=?")
    .get(slug);

  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  req.restaurant = {
    ...restaurant,
    features: restaurant.features ? JSON.parse(restaurant.features) : {},
    languages: restaurant.languages ? JSON.parse(restaurant.languages) : ["fr"],
    menus: restaurant.menus ? JSON.parse(restaurant.menus) : ["lunch"]
  };
  
  next();
}
