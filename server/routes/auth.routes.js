import express from "express";
import db from "../db/index.js";
import bcrypt from "bcrypt";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

/* =========================
   LOGIN PAGE
========================= */

router.get("/login", (req, res) => {
  res.render("admin/login", {
    restaurant: { slug: "Admin" }, // temporaire propre
    error: null
  });
});



/* =========================
   LOGIN POST
========================= */

router.post("/login", async (req, res) => {

  const { email, password } = req.body;
  const restaurant = req.restaurant;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND restaurant_id = ?")
    .get(email, restaurant.id);

  if (!user) {
    return res.render("admin/login", {
      restaurant,
      error: "Invalid credentials"
    });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.render("admin/login", {
      restaurant,
      error: "Invalid credentials"
    });
  }

  req.session.user = {
    id: user.id,
    restaurant_id: restaurant.id,
  };

  res.redirect("/admin/dashboard");
});


/* =========================
   DASHBOARD
========================= */

router.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/admin/login");
  }

  res.render("admin/dashboard", {
    restaurant: req.restaurant
  });
});



export default router;

router.get(
  "/settings",
  requireAdmin,
  (req, res) => {
    res.render("admin/settings", {
      restaurant: req.restaurant
    });
  }
);

router.post(
  "/settings",
  requireAdmin,
  (req, res) => {
    db.prepare(`
      UPDATE restaurants
      SET google_review_url = ?
      WHERE id = ?
    `).run(
      req.body.google_review_url || null,
      req.restaurant.id
    );

    res.redirect("/admin/dashboard");

  }
);


router.get(
  "/stats",
  requireAdmin,
  (req, res) => {
    if (!req.restaurant.features?.stats) {
      return res.status(404).send("Stats désactivées");
    }

    const pageViews = db
      .prepare(`
        SELECT count
        FROM stats_page_views
        WHERE restaurant_id = ?
      `)
      .get(req.restaurant.id)?.count || 0;

    const dishViews = db.prepare(`
      SELECT
        COALESCE(
          NULLIF(d.title_fr, ''),
          NULLIF(d.title_en, ''),
          'Plat sans nom'
        ) AS title,
        s.count
      FROM stats_dish_views s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
      AND d.status = 'published'
      ORDER BY s.count DESC
    `).all(req.restaurant.id);

    const totalDishViews = db.prepare(`
      SELECT SUM(s.count) AS total
      FROM stats_dish_views s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
      AND d.status = 'published'
    `).get(req.restaurant.id)?.total || 0;
    

    res.render("admin/stats", {
      restaurant: req.restaurant,
      pageViews,
      dishViews,
      totalDishViews
    });
    
  }
);
