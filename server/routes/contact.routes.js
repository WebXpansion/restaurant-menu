import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { name, restaurant, email, phone, message } = req.body;

    // 🔒 Validation simple
    if (!name || !restaurant || !email) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    await resend.emails.send({
      from: "Plateview <contact@plateview.fr>", // ⚠️ domaine validé chez Resend
      to: "TON_EMAIL_PERSO@gmail.com",
      subject: `Nouvelle demande Plateview – ${restaurant}`,
      html: `
        <h2>Nouvelle demande depuis la landing</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Restaurant :</strong> ${restaurant}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone || "Non renseigné"}</p>
        <p><strong>Message :</strong></p>
        <p>${message || "Aucun message"}</p>
      `
    });

    res.json({ success: true });

  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;