import express from "express";
import db from "../db/index.js";

const router = express.Router();

router.get("/:slug", (req, res) => {

  
  const restaurant = req.restaurant; 

  if (req.restaurant.features?.stats) {
    db.prepare(`
      INSERT INTO stats_page_views (restaurant_id, count)
      VALUES (?, 1)
      ON CONFLICT(restaurant_id)
      DO UPDATE SET count = count + 1
    `).run(req.restaurant.id);
  }
  

  const dishes = db.prepare(`
    SELECT
      d.*,
      s.name AS subcategory_name,
      GROUP_CONCAT(p.name, '||') AS tags
    FROM dishes d
    LEFT JOIN subcategories s ON d.subcategory_id = s.id
    LEFT JOIN dishes_pastilles dp ON dp.dish_id = d.id
    LEFT JOIN pastilles p ON p.id = dp.pastille_id
    WHERE d.restaurant_id = ?
      AND d.status = 'published'
    GROUP BY d.id
    ORDER BY d.category, s.name, d.title_fr
  `).all(restaurant.id);
  
  
  
  db.prepare(`
    INSERT INTO stats_events (restaurant_id, type)
    VALUES (?, 'page_view')
  `).run(req.restaurant.id);
  
  

  res.render("public/menu", {
    restaurant,
    dishes,
  });
});

export default router;
