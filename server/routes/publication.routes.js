import express from "express";
import { getPool } from "../db/postgres.js";

const router = express.Router();

/* =========================
   PAGE PRINCIPALE
========================= */
router.get("/", (req, res) => {
  res.render("admin/publication", {
    restaurant: req.restaurant
  });
});

/* =========================
   API – LISTE DES PLATS
========================= */
router.get("/api/dishes", async (req, res) => {

  const pool = getPool();

  const lang = req.query.lang || req.restaurant.languages[0];
  const allowedLanguages = req.restaurant.languages;

  const safeLang = allowedLanguages.includes(lang)
    ? lang
    : allowedLanguages[0];

  const { rows } = await pool.query(
    `
      SELECT
        d.id,
        dt.title,
        d.image_url,
        d.glb_url,
        d.scale
      FROM dishes d
      LEFT JOIN dish_translations dt
        ON dt.dish_id = d.id
        AND dt.language = $1
      WHERE d.restaurant_id = $2
        AND d.status = 'published'
      ORDER BY d.created_at DESC
    `,
    [safeLang, req.restaurant.id]
  );

  res.json(rows);
});

export default router;