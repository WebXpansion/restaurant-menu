import express from "express";
import { getPool } from "../db/postgres.js";
import { requireAdmin } from "../middleware/requireAdmin.js";


const router = express.Router();

router.use((req, res, next) => {


  if (!req.restaurant.features?.stats) {
    return res.status(403).json({ error: "Stats disabled" });
  }

  next();
});

router.post("/test", (req, res) => {
  res.send("STATS OK");
});


router.post("/dish/:id/view", async (req, res) => {
  const pool = getPool();

  if (!req.restaurant.features?.stats) {
    return res.sendStatus(204);
  }

  const dishId = req.params.id;

  const { rows } = await pool.query(`
    SELECT id FROM dishes
    WHERE id = $1
    AND restaurant_id = $2
  `, [dishId, req.restaurant.id]);

  if (!rows[0]) {
    return res.sendStatus(204);
  }

  await pool.query(`
    INSERT INTO stats_events (restaurant_id, type, dish_id)
    VALUES ($1, $2, $3)
  `, [req.restaurant.id, 'dish_view', dishId]);



  res.sendStatus(204);
});


router.get("/api/stats", requireAdmin, async (req, res) => {
  const pool = getPool();

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;

  let interval;
  let dateTrunc;

  switch (period) {
    case "hour":
      interval = "1 day";
      dateTrunc = "hour";
      break;

    case "month":
      interval = "1 month";
      dateTrunc = "day";
      break;

    case "year":
      interval = "1 year";
      dateTrunc = "month";
      break;

    default:
      interval = "7 days";
      dateTrunc = "day";
  }

  /* =========================
     PAGE VIEWS
  ========================= */

  const pageResult = await pool.query(`
    SELECT
      DATE_TRUNC('${dateTrunc}', created_at) AS label,
      COUNT(*)::int AS count
    FROM stats_events
    WHERE restaurant_id = $1
      AND type = 'page_view'
      AND created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY label
    ORDER BY label ASC
  `, [restaurantId]);

  const pageViews = pageResult.rows;

  /* =========================
     DISH VIEWS
  ========================= */

  const lang = req.restaurant.languages[0];

  const dishResult = await pool.query(`
    SELECT
      d.id,
      COALESCE(dt.title, 'Sans titre') AS title,
      COUNT(*)::int AS count
    FROM stats_events s
    JOIN dishes d ON d.id = s.dish_id
    LEFT JOIN dish_translations dt
      ON dt.dish_id = d.id
      AND dt.language = $2
    WHERE s.restaurant_id = $1
      AND s.type = 'dish_view'
    GROUP BY d.id, dt.title
    ORDER BY count DESC
  `, [restaurantId, lang]);

  const dishViews = dishResult.rows;

  res.json({
    pageViews,
    dishViews,
    totals: {
      pageViews: pageViews.reduce((a, b) => a + b.count, 0),
      dishViews: dishViews.reduce((a, b) => a + b.count, 0)
    }
  });
});


router.get("/api/stats/dish/:id", requireAdmin, async (req, res) => {
  const pool = getPool();

  if (!req.restaurant.features?.advancedDishStats) {
    return res.json([]);
  }

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;
  const dishId = req.params.id;

  let interval;
  let dateTrunc;

  switch (period) {
    case "hour":
      interval = "1 day";
      dateTrunc = "hour";
      break;

    case "month":
      interval = "1 month";
      dateTrunc = "day";
      break;

    case "year":
      interval = "1 year";
      dateTrunc = "month";
      break;

    default:
      interval = "7 days";
      dateTrunc = "day";
  }

  const result = await pool.query(`
    SELECT
      DATE_TRUNC('${dateTrunc}', created_at) AS label,
      COUNT(*)::int AS count
    FROM stats_events
    WHERE restaurant_id = $1
      AND dish_id = $2
      AND type = 'dish_view'
      AND created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY label
    ORDER BY label ASC
  `, [restaurantId, dishId]);

  res.json(result.rows);
});


router.get("/qr", requireAdmin, async (req, res) => {
  const pool = getPool();

  const { period = "day" } = req.query;
  const restaurantId = req.restaurant.id;

  let interval;
  let dateTrunc;

  switch (period) {
    case "hour":
      interval = "1 day";
      dateTrunc = "hour";
      break;

    case "month":
      interval = "1 month";
      dateTrunc = "day";
      break;

    case "year":
      interval = "1 year";
      dateTrunc = "month";
      break;

    default:
      interval = "1 day";
      dateTrunc = "hour";
  }

  const result = await pool.query(`
    SELECT
      DATE_TRUNC('${dateTrunc}', created_at) AS label,
      COUNT(*)::int AS count
    FROM stats_events
    WHERE restaurant_id = $1
      AND type = 'qr_scan'
      AND created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY label
    ORDER BY label ASC
  `, [restaurantId]);

  const labels = result.rows.map(r => r.label);
  const values = result.rows.map(r => r.count);

  res.json({ labels, values });
});

router.get(
  "/api/stats/compare",
  requireAdmin,
  async (req, res) => {

    const pool = getPool();

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;

    let interval;
    let dateTrunc;

    switch (period) {
      case "hour":
        interval = "1 hour";
        dateTrunc = "hour";
        break;

      case "month":
        interval = "1 month";
        dateTrunc = "day";
        break;

      case "year":
        interval = "1 year";
        dateTrunc = "month";
        break;

      default:
        interval = "1 day";
        dateTrunc = "day";
    }

    /* =========================
       CURRENT PERIOD
    ========================= */

    const currentResult = await pool.query(`
      SELECT
        DATE_TRUNC('${dateTrunc}', created_at) AS label,
        COUNT(*)::int AS count
      FROM stats_events
      WHERE restaurant_id = $1
        AND type = 'page_view'
        AND created_at >= DATE_TRUNC('${dateTrunc}', NOW())
      GROUP BY label
      ORDER BY label ASC
    `, [restaurantId]);

    /* =========================
       PREVIOUS PERIOD
    ========================= */

    const previousResult = await pool.query(`
      SELECT
        DATE_TRUNC('${dateTrunc}', created_at) AS label,
        COUNT(*)::int AS count
      FROM stats_events
      WHERE restaurant_id = $1
        AND type = 'page_view'
        AND created_at >= DATE_TRUNC('${dateTrunc}', NOW()) - INTERVAL '${interval}'
        AND created_at <  DATE_TRUNC('${dateTrunc}', NOW())
      GROUP BY label
      ORDER BY label ASC
    `, [restaurantId]);

    res.json({
      current: currentResult.rows,
      previous: previousResult.rows
    });
  }
);



router.post(
  "/dish/:id/ar",
  async (req, res) => {

    const pool = getPool();

    if (!req.restaurant.features?.stats) {
      return res.sendStatus(204);
    }

    const dishId = req.params.id;

    // 🔒 Vérifier que le plat appartient bien au restaurant
    const { rows } = await pool.query(`
      SELECT id FROM dishes
      WHERE id = $1
      AND restaurant_id = $2
    `, [dishId, req.restaurant.id]);

    if (!rows[0]) {
      return res.sendStatus(204);
    }

    await pool.query(`
      INSERT INTO stats_events (restaurant_id, type, dish_id)
      VALUES ($1, $2, $3)
    `, [req.restaurant.id, 'dish_ar_view', dishId]);

    res.sendStatus(200);
  }
);


router.get(
  "/api/stats/dish/:id/ar",
  requireAdmin,
  async (req, res) => {

    const pool = getPool();

    if (!req.restaurant.features?.advancedDishStats) {
      return res.json([]);
    }

    const { period = "day" } = req.query;
    const restaurantId = req.restaurant.id;
    const dishId = req.params.id;

    let interval;
    let dateTrunc;

    switch (period) {
      case "hour":
        interval = "1 day";
        dateTrunc = "hour";
        break;

      case "month":
        interval = "1 month";
        dateTrunc = "day";
        break;

      case "year":
        interval = "1 year";
        dateTrunc = "month";
        break;

      default:
        interval = "7 days";
        dateTrunc = "day";
    }

    const result = await pool.query(`
      SELECT
        DATE_TRUNC('${dateTrunc}', created_at) AS label,
        COUNT(*)::int AS count
      FROM stats_events
      WHERE restaurant_id = $1
        AND dish_id = $2
        AND type = 'dish_ar_view'
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY label
      ORDER BY label ASC
    `, [restaurantId, dishId]);

    res.json(result.rows);
  }
);


export default router;
