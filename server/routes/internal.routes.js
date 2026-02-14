import express from "express";
import db from "../db/index.js";
import { PLANS } from "../config/plans.js";

const router = express.Router();

/* =========================================================
   🔐 INTERNAL SECURITY LAYER
   - Secret key required
   - Optional IP whitelist in production
========================================================= */
router.use((req, res, next) => {

  const providedKey = req.headers["x-internal-key"];

  if (!providedKey || providedKey !== process.env.INTERNAL_ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Extra protection in production
  if (process.env.NODE_ENV === "production") {
    const allowedIPs = (process.env.INTERNAL_ALLOWED_IPS || "")
      .split(",")
      .map(ip => ip.trim())
      .filter(Boolean);

    if (allowedIPs.length && !allowedIPs.includes(req.ip)) {
      return res.status(403).json({ error: "IP not allowed" });
    }
  }

  next();
});

/* =========================================================
   🔄 CHANGE PLAN ENDPOINT
========================================================= */
router.post("/change-plan", (req, res) => {

  const { restaurantId, newPlan } = req.body;

  if (!restaurantId || !newPlan) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  if (!PLANS[newPlan]) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const result = db.prepare(`
    UPDATE restaurants
    SET plan = ?
    WHERE id = ?
  `).run(newPlan, restaurantId);

  if (!result.changes) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  console.log(`🔁 Plan updated → Restaurant ${restaurantId} → ${newPlan}`);

  res.json({ success: true });
});

/* =========================================================
   📊 OPTIONAL: GET RESTAURANT PLAN
   (useful for debugging or Stripe sync)
========================================================= */
router.get("/plan/:restaurantId", (req, res) => {

  const restaurant = db
    .prepare("SELECT id, name, plan FROM restaurants WHERE id = ?")
    .get(req.params.restaurantId);

  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  res.json(restaurant);
});

export default router;