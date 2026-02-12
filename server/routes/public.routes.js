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
      INSERT INTO stats_page_views (restaurant_id, count)
      VALUES (?, 1)
      ON CONFLICT(restaurant_id)
      DO UPDATE SET count = count + 1
    `).run(restaurant.id);
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

  res.render("public/menu", {
    restaurant,
    dishes,
    activeTab: "menu"
  });
});



/* =========================
   QR CODE
========================= */
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

  res.render("public/liste", {
    restaurant: req.restaurant,
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
