import express from "express";
import { requireAdminRestaurant } from "../middleware/adminRestaurant.js";
import { getPool } from "../db/postgres.js";

const router = express.Router();

/* =========================
   ADMIN ACCOUNT
========================= */

router.get("/", requireAdminRestaurant, async (req, res) => {

  const pool = getPool();
  const restaurant = req.restaurant;

  // On récupère l'utilisateur admin lié à ce restaurant
  const { rows } = await pool.query(`
    SELECT email
    FROM users
    WHERE restaurant_id = $1
    LIMIT 1
  `, [restaurant.id]);

  const user = rows[0];

  if (!user) {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/account", {
    email: user.email,
    planLabel: restaurant.planLabel
  });

});

export default router;