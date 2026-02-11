import express from "express";
import db from "../db/index.js";

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


router.get("/api/stats",
  (req, res) => {

    if (!req.restaurant.features?.stats) {
      return res.sendStatus(404);
    }

    const { period = "day" } = req.query;

    let format = "%Y-%m-%d";
    if (period === "hour") format = "%Y-%m-%d %H";
    if (period === "month") format = "%Y-%m";
    if (period === "year") format = "%Y";

    const pageViews = db.prepare(`
      SELECT
        strftime('${format}', created_at) AS label,
        COUNT(*) AS count
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
      GROUP BY label
      ORDER BY label
    `).all(req.restaurant.id);

    const totalPageViews = db.prepare(`
      SELECT COUNT(*) as total
      FROM stats_events
      WHERE restaurant_id = ?
        AND type = 'page_view'
    `).get(req.restaurant.id).total;

    const totalDishViews = db.prepare(`
      SELECT COUNT(*) AS total
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_view'
        AND d.status = 'published'
    `).get(req.restaurant.id).total;
    
    

    const dishViews = db.prepare(`
      SELECT
          s.dish_id AS id,
      COALESCE(d.title_fr, d.title_en, 'Plat') AS title,
      COUNT(*) AS count
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_view'
        AND d.status = 'published'
      GROUP BY s.dish_id
      ORDER BY count DESC
      LIMIT 10
    `).all(req.restaurant.id);

    res.json({
      pageViews,
      dishViews,
      totals: {
        pageViews: totalPageViews,
        dishViews: totalDishViews
      }
    });
    
  }
);

router.get(
  "/api/stats/dish/:id",
  (req, res) => {

    const { period = "day" } = req.query;

    let format = "%Y-%m-%d";
    if (period === "hour") format = "%Y-%m-%d %H";
    if (period === "month") format = "%Y-%m";
    if (period === "year") format = "%Y";

    const data = db.prepare(`
      SELECT
        strftime('${format}', s.created_at) AS label,
        COUNT(*) AS count
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_view'
        AND s.dish_id = ?
        AND d.status = 'published'
      GROUP BY label
      ORDER BY label
    `).all(req.restaurant.id, req.params.id);
    

    res.json(data);
  }
);

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
  (req, res) => {

    const { period = "day" } = req.query;

    let format = "%Y-%m-%d";
    if (period === "hour") format = "%Y-%m-%d %H";
    if (period === "month") format = "%Y-%m";
    if (period === "year") format = "%Y";

    const data = db.prepare(`
      SELECT
        strftime('${format}', s.created_at) AS label,
        COUNT(*) AS count
      FROM stats_events s
      JOIN dishes d ON d.id = s.dish_id
      WHERE s.restaurant_id = ?
        AND s.type = 'dish_ar_view'
        AND s.dish_id = ?
        AND d.status = 'published'
      GROUP BY label
      ORDER BY label
    `).all(req.restaurant.id, req.params.id);
    

    res.json(data);
  }
);


export default router;
