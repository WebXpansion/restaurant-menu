import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { getPool } from "../db/postgres.js";

const router = express.Router();

/* ==============================
   FORGOT PASSWORD
============================== */

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { success: false });
});

router.post("/forgot-password", async (req, res) => {

  const pool = getPool();
  const { email } = req.body;

  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  const user = rows[0];

  if (!user) {
    return res.render("forgot-password", { success: true });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  await pool.query(
    `
      UPDATE users
      SET reset_token_hash = $1,
          reset_token_expiry = $2
      WHERE id = $3
    `,
    [hash, expiry, user.id]
  );

  console.log("Reset link:");
  console.log(`http://localhost:3000/admin/reset-password?token=${rawToken}`);

  res.render("forgot-password", { success: true });
});

/* ==============================
   RESET PASSWORD PAGE
============================== */

router.get("/reset-password", (req, res) => {

  const { token } = req.query;

  if (!token) {
    return res.redirect("/admin/login");
  }

  res.render("reset-password", { token });
});

/* ==============================
   HANDLE RESET
============================== */

router.post("/reset-password", async (req, res) => {

  const pool = getPool();
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send("Missing fields");
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const { rows } = await pool.query(
    `
      SELECT *
      FROM users
      WHERE reset_token_hash = $1
    `,
    [hash]
  );

  const user = rows[0];

  if (!user) {
    return res.status(400).send("Invalid token");
  }

  if (new Date() > user.reset_token_expiry) {
    return res.status(400).send("Token expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `
      UPDATE users
      SET password_hash = $1,
          reset_token_hash = NULL,
          reset_token_expiry = NULL
      WHERE id = $2
    `,
    [passwordHash, user.id]
  );

  res.redirect("/admin/login");
});

export default router;