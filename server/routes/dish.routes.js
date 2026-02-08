import express from "express";
import db from "../db/index.js";
import { dishImageUpload, dishModelUpload } from "../middleware/upload.js";


const router = express.Router();

/* ======================
   LIST
====================== */
router.get("/:slug/dishes", (req, res) => {
  if (!req.session.user) return res.redirect(`/admin/${req.params.slug}/login`);

  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE slug=?")
    .get(req.params.slug);

  const dishes = db
    .prepare("SELECT * FROM dishes WHERE restaurant_id=?")
    .all(restaurant.id);

  res.render("admin/dishes", { slug: req.params.slug, dishes });
});

/* ======================
   FORM
====================== */
router.get("/:slug/dishes/new", (req, res) => {
  res.render("admin/dish-form", { slug: req.params.slug });
});

/* ======================
   CREATE
====================== */
router.post(
  "/:slug/dishes/new",
  (req, res, next) =>
    dishModelUpload(req.params.slug).fields([
      { name: "image", maxCount: 1 },
      { name: "glb", maxCount: 1 },
      { name: "usdz", maxCount: 1 }
    ])(req, res, next),
  
  
  (req, res) => {

    const restaurant = db
      .prepare("SELECT * FROM restaurants WHERE slug=?")
      .get(req.params.slug);

    const {
      title_fr,
      title_en,
      desc_short_fr,
      desc_short_en,
      desc_long_fr,
      desc_long_en,
      price,
      category,
      subcategory,
      availability
    } = req.body;

    const imagePath = req.files?.image?.[0] ? "/" + req.files.image[0].path : null;
    const glbPath   = req.files?.glb?.[0]   ? "/" + req.files.glb[0].path   : null;
    const usdzPath  = req.files?.usdz?.[0]  ? "/" + req.files.usdz[0].path  : null;
    

const scale = req.body.scale || 1;


db.prepare(`
  INSERT INTO dishes (
    restaurant_id,
    title_fr,
    title_en,
    desc_short_fr,
    desc_short_en,
    desc_long_fr,
    desc_long_en,
    price_cents,
    category,
    subcategory,
    availability,
    image_path,
    glb_path,
    usdz_path,
    scale
  )
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`).run(
  restaurant.id,
  title_fr,
  title_en,
  desc_short_fr,
  desc_short_en,
  desc_long_fr,
  desc_long_en,
  Math.round(price * 100),
  category,
  subcategory,
  availability,
  imagePath,
  glbPath,
  usdzPath,
  scale
);

    

    res.redirect(`/admin/${req.params.slug}/dishes`);
  }
);

/* ======================
   DELETE
====================== */
router.post("/:slug/dishes/:id/delete", (req, res) => {
  db.prepare("DELETE FROM dishes WHERE id=?").run(req.params.id);
  res.redirect(`/admin/${req.params.slug}/dishes`);
});

export default router;
