import express from "express";
import db from "../db/index.js";
import bcrypt from "bcrypt";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

/* =========================
   LOGIN PAGE
========================= */

router.get("/:slug/login", (req, res) => {
  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(req.params.slug);

  if (!restaurant) {
    return res.status(404).send("Restaurant introuvable");
  }

  res.render("admin/login", {
    restaurant,
    error: null
  });
});


/* =========================
   LOGIN POST
========================= */

router.post("/:slug/login", async (req, res) => {
  const { slug } = req.params;
  const { email, password } = req.body;

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(slug);

  if (!restaurant) return res.send("Restaurant not found");

  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND restaurant_id = ?")
    .get(email, restaurant.id);

  if (!user) {
    return res.render("admin/login", { slug, error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.render("admin/login", { slug, error: "Invalid credentials" });
  }

  req.session.user = {
    id: user.id,
    restaurant_id: restaurant.id,
  };

  res.redirect(`/admin/${slug}`);
});

/* =========================
   DASHBOARD
========================= */

router.get("/:slug", (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/admin/${req.params.slug}/login`);
  }

  res.render("admin/dashboard", {
    restaurant: req.restaurant
  });
});


export default router;

router.get(
  "/:slug/settings",
  requireAdmin,
  (req, res) => {
    res.render("admin/settings", {
      restaurant: req.restaurant
    });
  }
);

router.post(
  "/:slug/settings",
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

    res.redirect(`/admin/${req.params.slug}/settings`);
  }
);


router.get(
  "/:slug/stats",
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
