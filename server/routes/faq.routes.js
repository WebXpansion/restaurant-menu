import express from "express";
import { requireAdminRestaurant } from "../middleware/adminRestaurant.js";

const router = express.Router();

/* =========================
   ADMIN FAQ
========================= */

router.get("/", requireAdminRestaurant, (req, res) => {
  res.render("admin/faq", {
    activeTab: "faq"
  });
});

export default router;