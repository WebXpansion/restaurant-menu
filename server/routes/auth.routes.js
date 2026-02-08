import express from "express";
import db from "../db/index.js";
import bcrypt from "bcrypt";

const router = express.Router();

/* =========================
   LOGIN PAGE
========================= */

router.get("/:slug/login", (req, res) => {
  res.render("admin/login", { slug: req.params.slug, error: null });
});

/* =========================
   LOGIN POST
========================= */

router.post("/:slug/login", async (req, res) => {
  const { slug } = req.params;
  const { email, password } = req.body;

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug = ?")
    .get(slug);

  if (!restaurant) return res.send("Restaurant not found");

  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND restaurant_id = ?")
    .get(email, restaurant.id);

  if (!user) {
    return res.render("admin/login", { slug, error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.render("admin/login", { slug, error: "Invalid credentials" });
  }

  req.session.user = {
    id: user.id,
    restaurant_id: restaurant.id,
  };

  res.redirect(`/admin/${slug}`);
});

/* =========================
   DASHBOARD
========================= */

router.get("/:slug", (req, res) => {
  if (!req.session.user) return res.redirect(`/admin/${req.params.slug}/login`);

  res.render("admin/dashboard", { slug: req.params.slug });
});

export default router;
