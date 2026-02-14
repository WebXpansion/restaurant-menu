import express from "express";
import db from "../db/index.js";
import { requireAdmin } from "../middleware/requireAdmin.js";


const router = express.Router();

router.use((req, res, next) => {
  console.log("STATS CHECK →", req.restaurant.plan, req.restaurant.features);

  if (!req.restaurant.features?.stats) {
    return res.status(403).json({ error: "Stats disabled" });
  }

  next();
});

router.post("/test", (req, res) => {
  res.send("STATS OK");
});


router.post("/dish/:id/view", (req, res) => {

  if (!req.restaurant.features?.stats) {
    return res.sendStatus(204);
  }

  const dishId = parseInt(req.params.id, 10);

  // 🔒 Vérifier que le plat appartient au restaurant
  const dish = db.prepare(`
    SELECT id FROM dishes
    WHERE id = ?
    AND restaurant_id = ?
  `).get(dishId, req.restaurant.id);

  if (!dish) {
    return res.sendStatus(204);
  }

  db.prepare(`
    INSERT INTO stats_dish_views (restaurant_id, dish_id, count)
    VALUES (?, ?, 1)
    ON CONFLICT(restaurant_id, dish_id)
    DO UPDATE SET count = count + 1
  `).run(req.restaurant.id, dishId);

  db.prepare(`
    INSERT INTO stats_events (restaurant_id, type, dish_id)
    VALUES (?, 'dish_view', ?)
  `).run(req.restaurant.id, dishId);

  res.sendStatus(204);
});


router.get("/api/stats", requireAdmin, (req, res) => {

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;

  let groupFormat;
  let dateFilter = "";

  switch (period) {
    case "hour":
      groupFormat = "%H:00";
      dateFilter = "AND DATE(sp.created_at) = DATE('now')";
      break;

    case "month":
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND strftime('%Y-%m', sp.created_at) = strftime('%Y-%m', 'now')";
      break;

    case "year":
      groupFormat = "%Y-%m";
      dateFilter = "AND strftime('%Y', sp.created_at) = strftime('%Y', 'now')";
      break;

    default:
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND sp.created_at >= datetime('now', '-7 days')";
  }

  /* =========================
     PAGE VIEWS
  ========================= */

  const pageViews = db.prepare(`
    SELECT
      strftime('${groupFormat}', sp.created_at) as label,
      COUNT(*) as count
    FROM stats_page_views sp
    WHERE sp.restaurant_id = ?
      ${dateFilter}
    GROUP BY label
    ORDER BY label ASC
  `).all(restaurantId);


  /* =========================
     DISH VIEWS
  ========================= */

  const dishViews = db.prepare(`
    SELECT
      d.id,
      d.title_fr as title,
      COUNT(s.id) as count
    FROM stats_dish_views s
    JOIN dishes d ON d.id = s.dish_id
    WHERE s.restaurant_id = ?
      ${dateFilter.replace(/sp\./g, "s.")}
    GROUP BY d.id
    ORDER BY count DESC
  `).all(restaurantId);


  res.json({
    pageViews,
    dishViews,
    totals: {
      pageViews: pageViews.reduce((a,b) => a + b.count, 0),
      dishViews: dishViews.reduce((a,b) => a + b.count, 0)
    }
  });

});


router.get("/api/stats/dish/:id", requireAdmin, (req, res) => {

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;
  const dishId = parseInt(req.params.id);

  let groupFormat;
  let dateFilter = "";

  switch (period) {
    case "hour":
      groupFormat = "%H:00";
      dateFilter = "AND DATE(created_at) = DATE('now')";
      break;

    case "month":
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')";
      break;

    case "year":
      groupFormat = "%Y-%m";
      dateFilter = "AND strftime('%Y', created_at) = strftime('%Y', 'now')";
      break;

    default:
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
  }

  const data = db.prepare(`
    SELECT
      strftime('${groupFormat}', created_at) as label,
      COUNT(*) as count
    FROM stats_dish_views
    WHERE restaurant_id = ?
      AND dish_id = ?
      ${dateFilter}
    GROUP BY label
    ORDER BY label ASC
  `).all(restaurantId, dishId);

  res.json(data);
});


router.get("/qr", requireAdmin, (req, res) => {

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;

  let groupFormat;
  let dateFilter = "";

  switch (period) {

    case "hour":
      groupFormat = "%H:00";
      dateFilter = "AND DATE(created_at) = DATE('now')";
      break;

    case "month":
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')";
      break;

    case "year":
      groupFormat = "%Y-%m";
      dateFilter = "AND strftime('%Y', created_at) = strftime('%Y', 'now')";
      break;

    default: // day
      groupFormat = "%H:00";
      dateFilter = "AND DATE(created_at) = DATE('now')";
  }

  const rows = db.prepare(`
    SELECT
      strftime('${groupFormat}', created_at) as label,
      COUNT(*) as count
    FROM stats_events
    WHERE restaurant_id = ?
      AND type = 'qr_scan'
      ${dateFilter}
    GROUP BY label
    ORDER BY label ASC
  `).all(restaurantId);

  const labels = rows.map(r => r.label);
  const values = rows.map(r => r.count);

  res.json({ labels, values });
});


router.get(
  "/api/stats/compare",
  requireAdmin,
  (req, res) => {

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;

    let format = "%Y-%m-%d";
    let shift = "-1 day";
    let startOf = "day";

    switch (period) {

      case "hour":
        format = "%Y-%m-%d %H";
        shift = "-1 hour";
        startOf = "hour";
        break;

      case "month":
        format = "%Y-%m";
        shift = "-1 month";
        startOf = "month";
        break;

      case "year":
        format = "%Y";
        shift = "-1 year";
        startOf = "year";
        break;

      default:
        format = "%Y-%m-%d";
        shift = "-1 day";
        startOf = "day";
    }

    /* =========================
       CURRENT PERIOD
    ========================= */

    const current = db.prepare(`
      SELECT
        strftime('${format}', created_at) AS label,
        COUNT(*) AS count
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
        AND created_at >= datetime('now', 'start of ${startOf}')
      GROUP BY label
      ORDER BY label ASC
    `).all(restaurantId);

    /* =========================
       PREVIOUS PERIOD
    ========================= */

    const previous = db.prepare(`
      SELECT
        strftime('${format}', created_at) AS label,
        COUNT(*) AS count
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
        AND created_at >= datetime('now', 'start of ${startOf}', '${shift}')
        AND created_at <  datetime('now', 'start of ${startOf}')
      GROUP BY label
      ORDER BY label ASC
    `).all(restaurantId);

    res.json({ current, previous });
  }
);

router.post(
  "/dish/:id/ar",
  (req, res) => {

    if (!req.restaurant.features?.stats) {
      return res.sendStatus(204);
    }

    const dishId = parseInt(req.params.id, 10);

    // 🔒 Vérifier que le plat appartient bien au restaurant
    const dish = db.prepare(`
      SELECT id FROM dishes
      WHERE id = ?
      AND restaurant_id = ?
    `).get(dishId, req.restaurant.id);

    if (!dish) {
      return res.sendStatus(204);
    }

    db.prepare(`
      INSERT INTO stats_events (restaurant_id, type, dish_id)
      VALUES (?, 'dish_ar_view', ?)
    `).run(req.restaurant.id, dishId);

    res.sendStatus(200);
  }
);

router.get(
  "/api/stats/dish/:id/ar",
  requireAdmin,
  (req, res) => {

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;
    const dishId = parseInt(req.params.id);

    let groupFormat;
    let dateFilter = "";

    switch (period) {

      case "hour":
        groupFormat = "%H:00";
        dateFilter = "AND DATE(s.created_at) = DATE('now')";
        break;

      case "month":
        groupFormat = "%Y-%m-%d";
        dateFilter = "AND strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')";
        break;

      case "year":
        groupFormat = "%Y-%m";
        dateFilter = "AND strftime('%Y', s.created_at) = strftime('%Y', 'now')";
        break;

      default:
        groupFormat = "%Y-%m-%d";
        dateFilter = "AND s.created_at >= datetime('now', '-7 days')";
    }

    const data = db.prepare(`
      SELECT
        strftime('${groupFormat}', s.created_at) AS label,
        COUNT(*) AS count
      FROM stats_dish_ar_views s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.dish_id = ?
        AND d.status = 'published'
        ${dateFilter}
      GROUP BY label
      ORDER BY label ASC
    `).all(restaurantId, dishId);

    res.json(data);
  }
);



export default router;
