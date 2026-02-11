import db from "../db/index.js";
import { PLANS } from "../config/plans.js";

export function attachRestaurant(req, res, next) {
    const { slug } = req.params;
  
    const restaurant = db
      .prepare("SELECT * FROM restaurants WHERE slug = ?")
      .get(slug);
  
    if (!restaurant) {
      return res.status(404).send("Restaurant not found");
    }
  
    // 🔥 PARSE FEATURES (CRITIQUE)
    try {
        restaurant.features = restaurant.features
          ? JSON.parse(restaurant.features)
          : {};
      } catch {
        restaurant.features = {};
      }
      
      try {
        restaurant.limits = restaurant.limits
          ? JSON.parse(restaurant.limits)
          : {};
      } catch {
        restaurant.limits = {};
      }
      
      req.restaurant = restaurant;
      res.locals.restaurant = restaurant;
      next();

  }
  
