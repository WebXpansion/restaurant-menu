import express from "express";
import { getPool } from "../db/postgres.js";
import QRCode from "qrcode";
import { CATEGORY_TRANSLATIONS } from "../config/categories.js";
import { UI_TRANSLATIONS } from "../config/categories.js";


const router = express.Router();

/* =========================
   MENU
========================= */
router.get("/", async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;

  if (restaurant.features?.stats) {
    await pool.query(
      `
        INSERT INTO stats_events (restaurant_id, type)
        VALUES ($1, 'page_view')
      `,
      [restaurant.id]
    );
  }

  let lang = req.query.lang;

  if (lang && restaurant.languages.includes(lang)) {
    req.session.lang = lang;
  }

  if (!lang) {
    lang = req.session.lang;
  }

  if (!lang || !restaurant.languages.includes(lang)) {
    lang = restaurant.languages[0];
  }

  const safeLang = lang;

  const { rows: dishes } = await pool.query(
    `
      SELECT
        d.*,
        dt.title,
        dt.desc_short,
        s.name AS subcategory_name,
        STRING_AGG(t.name, '||') AS tags
      FROM dishes d
      LEFT JOIN dish_translations dt
        ON dt.dish_id = d.id
        AND dt.language = $1
      LEFT JOIN subcategories s
        ON d.subcategory_id = s.id
      LEFT JOIN dish_tags dp
        ON dp.dish_id = d.id
      LEFT JOIN tags t
        ON t.id = dp.tag_id
      WHERE d.restaurant_id = $2
        AND d.status = 'published'
      GROUP BY d.id, dt.title, dt.desc_short, s.name
      ORDER BY d.category, s.name, dt.title
    `,
    [safeLang, restaurant.id]
  );

  const categories = {};

  Object.keys(CATEGORY_TRANSLATIONS).forEach(key => {
    categories[key] =
      CATEGORY_TRANSLATIONS[key][safeLang] ||
      CATEGORY_TRANSLATIONS[key]["fr"];
  });

  const ui = {};

  for (const key in UI_TRANSLATIONS) {
  
    if (typeof UI_TRANSLATIONS[key] === "object") {
  
      ui[key] = {};
  
      for (const subKey in UI_TRANSLATIONS[key]) {
  
        if (typeof UI_TRANSLATIONS[key][subKey] === "object") {
  
          ui[key][subKey] =
            UI_TRANSLATIONS[key][subKey][safeLang] ||
            UI_TRANSLATIONS[key][subKey]["fr"];
  
        }
  
      }
  
    }
  
  }

  res.render("public/menu", {
    restaurant,
    dishes,
    activeTab: "menu",
    currentLang: safeLang,
    categories,
    ui
  });

});

router.post("/api/validate-list", async (req, res) => {

  const pool = getPool();
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json([]);
  }

  const { rows } = await pool.query(
    `
      SELECT id
      FROM dishes
      WHERE restaurant_id = $1
        AND status = 'published'
        AND id = ANY($2::uuid[])
    `,
    [req.restaurant.id, ids]
  );

  res.json(rows.map(d => d.id));

});

router.post("/api/dish-view/:id", async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;
  const dishId = req.params.id;

  if (!restaurant.features?.stats) {
    return res.sendStatus(200);
  }

  const { rows } = await pool.query(`
    SELECT id
    FROM dishes
    WHERE id = $1
      AND restaurant_id = $2
      AND status = 'published'
  `, [dishId, restaurant.id]);

  if (!rows[0]) {
    return res.sendStatus(200);
  }

  await pool.query(`
    INSERT INTO stats_events (restaurant_id, type, dish_id)
    VALUES ($1, $2, $3)
  `, [restaurant.id, 'dish_view', dishId]);

  res.sendStatus(200);
});

/* =========================
   QR CODE
========================= */

router.post("/stats/ar/:dishId", async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;
  const dishId = req.params.dishId;

  if (!restaurant.features?.stats) {
    return res.sendStatus(200);
  }

  const { rows } = await pool.query(`
    SELECT id
    FROM dishes
    WHERE id = $1
      AND restaurant_id = $2
      AND status = 'published'
  `, [dishId, restaurant.id]);

  if (!rows[0]) {
    return res.sendStatus(200);
  }

  await pool.query(`
    INSERT INTO stats_events (restaurant_id, type, dish_id)
    VALUES ($1, $2, $3)
  `, [restaurant.id, 'dish_ar_view', dishId]);

  res.sendStatus(200);
});

router.get("/qrcode", (req, res) => {

  const restaurant = req.restaurant;
  const lang = req.session.lang || restaurant.languages[0];

  const scanTitle =
    UI_TRANSLATIONS.scan_title[lang] ||
    UI_TRANSLATIONS.scan_title["fr"];

  const shareText =
    UI_TRANSLATIONS.share_button[lang] ||
    UI_TRANSLATIONS.share_button["fr"];

  res.render("public/qrcode", {
    restaurant,
    activeTab: "qr",
    scanTitle,
    shareText
  });

});

router.get("/qrcode/image", async (req, res) => {

  const url = `${req.protocol}://${req.get("host")}/scan`;

  try {
    const qr = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2
    });

    res.setHeader("Content-Type", "image/png");
    res.send(qr);

  } catch (err) {
    res.status(500).send("QR generation error");
  }

});

router.get("/scan", async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;

  await pool.query(`
    INSERT INTO stats_events (restaurant_id, type)
    VALUES ($1, $2)
  `, [restaurant.id, 'qr_scan']);

  res.redirect("/");
});





/* =========================
   LISTE
========================= */
router.get("/liste", async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;

  let lang = req.query.lang;

  if (lang && restaurant.languages.includes(lang)) {
    req.session.lang = lang;
  }

  if (!lang) {
    lang = req.session.lang;
  }

  if (!lang || !restaurant.languages.includes(lang)) {
    lang = restaurant.languages[0];
  }

  const safeLang = lang;

  const { rows: dishes } = await pool.query(
    `
      SELECT
        d.*,
        dt.title,
        dt.desc_short,
        s.name AS subcategory_name,
        STRING_AGG(t.name, '||') AS tags
      FROM dishes d
      LEFT JOIN dish_translations dt
        ON dt.dish_id = d.id
        AND dt.language = $1
      LEFT JOIN subcategories s
        ON d.subcategory_id = s.id
    LEFT JOIN dish_tags dp
      ON dp.dish_id = d.id
      LEFT JOIN tags t
        ON t.id = dp.tag_id
      WHERE d.restaurant_id = $2
        AND d.status = 'published'
      GROUP BY d.id, dt.title, dt.desc_short, s.name
      ORDER BY d.category, s.name, dt.title
    `,
    [safeLang, restaurant.id]
  );

  res.render("public/liste", {
    restaurant,
    dishes,
    activeTab: "liste",
    currentLang: safeLang
  });

});


router.post("/api/list-data", async (req, res) => {

  const pool = getPool();
  const { ids } = req.body;
  const restaurant = req.restaurant;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json([]);
  }

  const lang = req.session.lang || restaurant.languages[0];

  const { rows } = await pool.query(`
    SELECT
      d.id,
      d.price_cents,
      d.image_url,
      d.glb_url,
      d.usdz_url,
      d.scale,
      dt.title,
      dt.desc_short
    FROM dishes d
    LEFT JOIN dish_translations dt
      ON dt.dish_id = d.id
      AND dt.language = $1
    WHERE d.restaurant_id = $2
      AND d.status = 'published'
      AND d.id = ANY($3::uuid[])
  `, [lang, restaurant.id, ids]);

  res.json(rows);
});


/* =========================
   RESTAURANT
========================= */
router.get("/restaurant", (req, res) => {

  res.render("public/restaurant", {
    restaurant: req.restaurant,
    activeTab: "restaurant"
  });

});

export default router;
