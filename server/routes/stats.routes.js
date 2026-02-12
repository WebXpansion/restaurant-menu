import express from "express";
import db from "../db/index.js";
import { requireAdmin } from "../middleware/requireAdmin.js";


const router = express.Router();

router.post("/test", (req, res) => {
  res.send("STATS OK");
});


router.post("/dish/:id/view", (req, res) => {
  if (!req.restaurant.features?.stats) {
    return res.sendStatus(204);
  }

  db.prepare(`
    INSERT INTO stats_dish_views (restaurant_id, dish_id, count)
    VALUES (?, ?, 1)
    ON CONFLICT(restaurant_id, dish_id)
    DO UPDATE SET count = count + 1
  `).run(req.restaurant.id, req.params.id);

  db.prepare(`
    INSERT INTO stats_events (restaurant_id, type, dish_id)
    VALUES (?, 'dish_view', ?)
  `).run(req.restaurant.id, req.params.id);

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
      groupFormat = "%Y-%m-%d";
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    
  }
  

  const pageViews = db.prepare(`
    SELECT
      strftime('${groupFormat}', created_at) as label,
      COUNT(*) as count
    FROM stats_events
    WHERE restaurant_id = ?
      AND type = 'page_view'
      ${dateFilter}
    GROUP BY label
    ORDER BY label ASC
  `).all(restaurantId);

  const dishViews = db.prepare(`
    SELECT
      d.id,
      d.title_fr as title,
      COUNT(se.id) as count
    FROM stats_events se
    JOIN dishes d ON se.dish_id = d.id
    WHERE se.restaurant_id = ?
      AND se.type = 'dish_view'
      ${dateFilter}
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


router.get(
  "/api/stats/dish/:id",
  requireAdmin,
  (req, res) => {

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;
    const dishId = req.params.id;

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

      default: // day
        groupFormat = "%H:00";
        dateFilter = "AND DATE(s.created_at) = DATE('now')";
    }

    const data = db.prepare(`
      SELECT
        strftime('${groupFormat}', s.created_at) AS label,
        COUNT(*) AS count
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_view'
        AND s.dish_id = ?
        AND d.status = 'published'
        ${dateFilter}
      GROUP BY label
      ORDER BY label ASC
    `).all(restaurantId, dishId);

    res.json(data);
  }
);


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
  (req, res) => {

    const { period = "day" } = req.query;

    let format = "%Y-%m-%d";
    let shift = "-1 day";

    if (period === "hour") {
      format = "%Y-%m-%d %H";
      shift = "-1 hour";
    }
    if (period === "month") {
      format = "%Y-%m";
      shift = "-1 month";
    }
    if (period === "year") {
      format = "%Y";
      shift = "-1 year";
    }

    const current = db.prepare(`
      SELECT
        strftime('${format}', created_at) AS label,
        COUNT(*) AS count
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
        AND created_at >= datetime('now', 'start of ${period}')
      GROUP BY label
      ORDER BY label
    `).all(req.restaurant.id);

    const previous = db.prepare(`
      SELECT
        strftime('${format}', created_at) AS label,
        COUNT(*) AS count
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
        AND created_at >= datetime('now', 'start of ${period}', '${shift}')
        AND created_at <  datetime('now', 'start of ${period}')
      GROUP BY label
      ORDER BY label
    `).all(req.restaurant.id);

    res.json({ current, previous });
  }
);


router.post(
  "/dish/:id/ar",
  (req, res) => {

    if (!req.restaurant.features?.stats) {
      return res.sendStatus(204);
    }

    db.prepare(`
      INSERT INTO stats_events (restaurant_id, type, dish_id)
      VALUES (?, 'dish_ar_view', ?)
    `).run(req.restaurant.id, req.params.id);

    res.sendStatus(200);
  }
);


router.get(
  "/api/stats/dish/:id/ar",
  requireAdmin,
  (req, res) => {

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;
    const dishId = req.params.id;

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
        groupFormat = "%H:00";
        dateFilter = "AND DATE(s.created_at) = DATE('now')";
    }

    const data = db.prepare(`
      SELECT
        strftime('${groupFormat}', s.created_at) AS label,
        COUNT(*) AS count
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_ar_view'
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
