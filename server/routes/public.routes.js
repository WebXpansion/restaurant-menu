import express from "express";
import db from "../db/index.js";
import QRCode from "qrcode";

const router = express.Router();

/* =========================
   MENU
========================= */
router.get("/", (req, res) => {

  const restaurant = req.restaurant;

  if (restaurant.features?.stats) {
    db.prepare(`
      INSERT INTO stats_page_views (restaurant_id)
      VALUES (?)
    `).run(restaurant.id);
  }

  const dishes = db.prepare(`
    SELECT
      d.*,
      s.name AS subcategory_name,
      GROUP_CONCAT(t.name, '||') AS tags
    FROM dishes d
    LEFT JOIN subcategories s ON d.subcategory_id = s.id
    LEFT JOIN dishes_pastilles dp ON dp.dish_id = d.id
    LEFT JOIN tags t ON t.id = dp.tag_id
    WHERE d.restaurant_id = ?
      AND d.status = 'published'
    GROUP BY d.id
    ORDER BY d.category, s.name, d.title_fr
  `).all(restaurant.id);

  res.render("public/menu", {
    restaurant,
    dishes,
    activeTab: "menu"
  });
});

router.post("/api/validate-list", (req, res) => {

  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json([]);
  }

  const placeholders = ids.map(() => "?").join(",");

  const valid = db.prepare(`
    SELECT id
    FROM dishes
    WHERE restaurant_id = ?
      AND status = 'published'
      AND id IN (${placeholders})
  `).all(req.restaurant.id, ...ids);

  res.json(valid.map(d => d.id));
});


router.post("/api/dish-view/:id", (req, res) => {

  const restaurant = req.restaurant;
  const dishId = parseInt(req.params.id, 10);

  if (!restaurant.features?.stats) {
    return res.sendStatus(200);
  }

  // 🔒 Vérifier que le plat existe et est publié
  const dish = db.prepare(`
    SELECT id
    FROM dishes
    WHERE id = ?
      AND restaurant_id = ?
      AND status = 'published'
  `).get(dishId, restaurant.id);

  if (!dish) {
    return res.sendStatus(200);
  }

  db.prepare(`
    INSERT INTO stats_dish_views (restaurant_id, dish_id)
    VALUES (?, ?)
  `).run(restaurant.id, dishId);

  res.sendStatus(200);
});

/* =========================
   QR CODE
========================= */

router.post("/stats/ar/:dishId", (req, res) => {

  const restaurant = req.restaurant;
  const dishId = parseInt(req.params.dishId, 10);

  if (!restaurant.features?.stats) {
    return res.sendStatus(200);
  }

  // 🔒 Vérifier que le plat existe et est publié
  const dish = db.prepare(`
    SELECT id
    FROM dishes
    WHERE id = ?
      AND restaurant_id = ?
      AND status = 'published'
  `).get(dishId, restaurant.id);

  if (!dish) {
    return res.sendStatus(200);
  }

  db.prepare(`
    INSERT INTO stats_dish_ar_views (restaurant_id, dish_id)
    VALUES (?, ?)
  `).run(restaurant.id, dishId);

  res.sendStatus(200);
});

router.get("/qrcode", (req, res) => {

  res.render("public/qrcode", {
    restaurant: req.restaurant,
    activeTab: "qr"
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

router.get("/scan", (req, res) => {

  const restaurant = req.restaurant;

  db.prepare(`
    INSERT INTO stats_events (restaurant_id, type)
    VALUES (?, 'qr_scan')
  `).run(restaurant.id);

  res.redirect("/");
});





/* =========================
   LISTE
========================= */
router.get("/liste", (req, res) => {

  const restaurant = req.restaurant;

  const dishes = db.prepare(`
    SELECT
      d.*,
      s.name AS subcategory_name,
      GROUP_CONCAT(t.name, '||') AS tags
    FROM dishes d
    LEFT JOIN subcategories s ON d.subcategory_id = s.id
    LEFT JOIN dishes_pastilles dp ON dp.dish_id = d.id
    LEFT JOIN tags t ON t.id = dp.tag_id
    WHERE d.restaurant_id = ?
      AND d.status = 'published'
    GROUP BY d.id
    ORDER BY d.category, s.name, d.title_fr
  `).all(restaurant.id);

  console.log(
    dishes.map(d => ({ id: d.id, status: d.status }))
  );

  res.render("public/liste", {
    restaurant,
    dishes,
    activeTab: "liste"
  });

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
