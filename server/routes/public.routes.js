import express from "express";
import db from "../db/index.js";

const router = express.Router();

router.get("/:slug", (req, res) => {
  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(req.params.slug);

  if (!restaurant) return res.send("Restaurant not found");

  const dishes = db
    .prepare("SELECT * FROM dishes WHERE restaurant_id = ?")
    .all(restaurant.id);

  res.render("public/menu", {
    restaurant,
    dishes,
  });
});

export default router;
