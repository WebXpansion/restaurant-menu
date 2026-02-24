import express from "express";
import bcrypt from "bcrypt";
import { requireAdmin } from "../middleware/requireAdmin.js";
import path from "path";
import { fileURLToPath } from "url";
import { getPool } from "../db/postgres.js";


console.log("POSTGRES FILE LOADED");
console.log("DATABASE_URL inside postgres.js:", process.env.DATABASE_URL);

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

  
  const pool = getPool();
  const { email, password } = req.body;
  const restaurant = req.restaurant;

  const { rows } = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
        AND restaurant_id = $2
    `,
    [email.trim(), restaurant.id]
  );

  const user = rows[0];

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
  async (req, res) => {

    const pool = getPool();

    await pool.query(
      `
        UPDATE restaurants
        SET google_review_url = $1,
            updated_at = NOW()
        WHERE id = $2
      `,
      [req.body.google_review_url || null, req.restaurant.id]
    );

    res.redirect("/admin/dashboard");
  }
);


router.get(
  "/stats",
  requireAdmin,
  async (req, res) => {

    const pool = getPool();

    if (!req.restaurant.features?.stats) {
      return res.status(404).send("Stats désactivées");
    }

    // PAGE VIEWS
    const { rows: pageRows } = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM stats_events
        WHERE restaurant_id = $1
          AND type = 'page_view'
      `,
      [req.restaurant.id]
    );

    const pageViews = pageRows[0]?.total || 0;

    // DISH VIEWS PAR PLAT
    const { rows: dishViews } = await pool.query(
      `
        SELECT
          d.id,
          COALESCE(dt.title, 'Plat sans nom') AS title,
          COUNT(s.id)::int AS count
        FROM stats_events s
        JOIN dishes d ON d.id = s.dish_id
        LEFT JOIN dish_translations dt
          ON dt.dish_id = d.id
          AND dt.language = $2
        WHERE s.restaurant_id = $1
          AND s.type = 'dish_view'
          AND d.status = 'published'
        GROUP BY d.id, dt.title
        ORDER BY count DESC
      `,
      [req.restaurant.id, "fr"]
    );

    // TOTAL VUES PLATS
    const { rows: totalRows } = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM stats_events s
        JOIN dishes d ON d.id = s.dish_id
        WHERE s.restaurant_id = $1
          AND s.type = 'dish_view'
          AND d.status = 'published'
      `,
      [req.restaurant.id]
    );

    const totalDishViews = totalRows[0]?.total || 0;

    res.render("admin/stats", {
      restaurant: req.restaurant,
      pageViews,
      dishViews,
      totalDishViews
    });
  }
);

export default router;