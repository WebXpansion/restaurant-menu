import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { getPool } from "../db/postgres.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
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
  
  const expiry = new Date(Date.now() + 1000 * 60 * 15);
  
  await pool.query(
    `
      UPDATE users
      SET reset_token_hash = $1,
          reset_token_expiry = $2
      WHERE id = $3
    `,
    [hash, expiry, user.id]
  );
  
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const resetLink = `${baseUrl}/admin/reset-password?token=${rawToken}`;
  
  console.log("Reset link:");
  await resend.emails.send({
    from: "Plateview <no-reply@plateview.fr>",
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous :</p>
        <a href="${resetLink}" 
           style="display:inline-block;padding:12px 20px;background:black;color:white;text-decoration:none;border-radius:8px;">
           Réinitialiser mon mot de passe
        </a>
        <p style="margin-top:20px;font-size:12px;color:#666;">
          Ce lien expire dans 15 minutes.
        </p>
      </div>
    `
  });

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
        AND reset_token_expiry > NOW()
    `,
    [hash]
  );

  const user = rows[0];

  if (!user) {
    return res.status(400).send("Invalid token");
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