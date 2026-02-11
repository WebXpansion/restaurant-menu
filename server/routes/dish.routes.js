import express from "express";
import db from "../db/index.js";
import { dishImageUpload, dishModelUpload } from "../middleware/upload.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getTagsByRestaurant,
  createTag,
  deleteTag,
  getDishTags,
  setDishTags
} from "../services/tag.service.js";




const router = express.Router();

/* ======================
   LIST
====================== */
router.get("/:slug/dishes", requireAdmin, (req, res) => {




  const dishes = db
    .prepare("SELECT * FROM dishes WHERE restaurant_id=?")
    .all(req.restaurant.id);

    const maxAR = req.restaurant.limits?.maxArDishes ?? 0;

const usedAR = db.prepare(`
  SELECT COUNT(*) as count
  FROM dishes
  WHERE restaurant_id = ?
    AND has_ar = 1
    AND status = 'published'
`).get(req.restaurant.id).count;



  res.render("admin/dishes", {
    restaurant: req.restaurant,
    dishes,
    arUsage: {
      used: usedAR,
      max: maxAR
    }
  });

});

/* ======================
   FORM
====================== */
router.get("/:slug/dishes/new", requireAdmin, (req, res) => {

  const tags = getTagsByRestaurant(req.restaurant.id);

  const subcategories = db
    .prepare(`
      SELECT * FROM subcategories
      WHERE restaurant_id = ?
      ORDER BY name
    `)
    .all(req.restaurant.id);

  const maxAR = req.restaurant.limits?.maxArDishes ?? 0;

  const usedAR = db.prepare(`
    SELECT COUNT(*) as count
    FROM dishes
    WHERE restaurant_id = ?
      AND has_ar = 1
      AND status = 'published'
  `).get(req.restaurant.id).count;

  res.render("admin/dish-form", {
    restaurant: req.restaurant,
    subcategories,
    dish: null,
    arConfigured: false,
    arUsage: {
      used: usedAR,
      max: maxAR
    },
    tags,
    dishTags: []   
  });

});



/* ======================
   CREATE
====================== */
router.post(
  "/:slug/dishes/new",
  requireAdmin,
  (req, res, next) =>
    dishModelUpload(req.params.slug).fields([
      { name: "image", maxCount: 1 },
      { name: "glb", maxCount: 1 },
      { name: "usdz", maxCount: 1 }
    ])(req, res, next),

  (req, res) => {

    /* ======================
       1️⃣ DÉTECTER SI AR DEMANDÉ
    ====================== */





    /* ======================
       3️⃣ DATA FORM
    ====================== */
    const {
      title_fr,
      title_en,
      desc_short_fr,
      desc_short_en,
      desc_long_fr,
      desc_long_en,
      price,
      category,
      subcategory_id,
      availability,
      status
    } = req.body;

    const finalStatus = status || "published";

    const wantsAR =
    req.body.has_ar === "1" ||
    !!req.files?.glb ||
    !!req.files?.usdz;

    const hasAR =
  finalStatus === "published" && wantsAR ? 1 : 0;


        /* ======================
       2️⃣ LIMITE DE L’OFFRE
    ====================== */
    const maxAR = req.restaurant.limits?.maxArDishes ?? 0;

    if (status === "published" && wantsAR && maxAR > 0) {

      const { count } = db
        .prepare(`
        SELECT COUNT(*) as count
        FROM dishes
        WHERE restaurant_id = ?
          AND has_ar = 1
          AND status = 'published'
        `)
        .get(req.restaurant.id);

      if (count >= maxAR) {
        return res.status(403).json({
          error: "AR_LIMIT_REACHED",
          maxAR
        });
        
      }
    }
  




    /* ======================
       4️⃣ FILES
    ====================== */
    let imagePath = null;
    let imageOriginalName = null;

    if (req.files?.image) {
      const file = req.files.image[0];
      imagePath = "/" + file.path;
      imageOriginalName = file.originalname;
    }

    let glbPath = null;
    let glbOriginalName = null;

    if (req.files?.glb) {
      const file = req.files.glb[0];
      glbPath = "/" + file.path;
      glbOriginalName = file.originalname;
    }

    let usdzPath = null;
    let usdzOriginalName = null;

    if (req.files?.usdz) {
      const file = req.files.usdz[0];
      usdzPath = "/" + file.path;
      usdzOriginalName = file.originalname;
    }

    const scale = req.body.scale || 1;

    /* ======================
       5️⃣ INSERT
    ====================== */
    const insertResult = db.prepare(`
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
        subcategory_id,
        availability,
        image_path,
        image_original_name,
        glb_path,
        glb_original_name,
        usdz_path,
        usdz_original_name,
        scale,
        status,
        has_ar
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      req.restaurant.id,
      title_fr,
      title_en,
      desc_short_fr,
      desc_short_en,
      desc_long_fr,
      desc_long_en,
      Math.round(price * 100),
      category,
      subcategory_id,
      availability,
      imagePath,
      imageOriginalName,
      glbPath,
      glbOriginalName,
      usdzPath,
      usdzOriginalName,
      scale,
      finalStatus,
      hasAR
    );

    // ======================
// TAGS (BADGES)
// ======================

const tagIds = req.body.tags
  ? (Array.isArray(req.body.tags)
      ? req.body.tags
      : [req.body.tags]
    ).map(id => parseInt(id, 10)).filter(Boolean)
  : [];


setDishTags(
insertResult.lastInsertRowid,
tagIds,
req.restaurant.id
);

    

    res.redirect(`/admin/${req.params.slug}/dishes`);
  }
);


/* ======================
   DELETE
====================== */

router.post(
  "/:slug/dishes/:id/delete",
  requireAdmin,
  (req, res) => {
    db.prepare(`
      DELETE FROM dishes
      WHERE id=? AND restaurant_id=?
    `).run(req.params.id, req.restaurant.id);

    res.redirect(`/admin/${req.params.slug}/dishes`);
  }
);




router.post("/:slug/subcategories", requireAdmin, (req, res) => {



  const { name, category } = req.body;

  db.prepare(`
    INSERT INTO subcategories (restaurant_id, category, name)
    VALUES (?,?,?)
  `).run(req.restaurant.id, category, name);


  res.sendStatus(200);
});


router.get("/:slug/dishes/:id/edit", requireAdmin, (req, res) => {

  if (!req.session.user) {
    return res.redirect(`/admin/${req.params.slug}/login`);
  }

  const tags = getTagsByRestaurant(req.restaurant.id);



  const dish = db
  .prepare("SELECT * FROM dishes WHERE id = ? AND restaurant_id = ?")
  .get(req.params.id, req.restaurant.id);


  const subcategories = db
    .prepare(`
      SELECT * FROM subcategories
      WHERE restaurant_id = ?
      ORDER BY name
    `)
    .all(req.restaurant.id);

    const maxAR = req.restaurant.limits?.maxArDishes ?? 0;

const usedAR = db.prepare(`
  SELECT COUNT(*) as count
  FROM dishes
  WHERE restaurant_id = ?
    AND has_ar = 1
    AND status = 'published'
`).get(req.restaurant.id).count;


res.render("admin/dish-form", {
  restaurant: req.restaurant,
  subcategories,
  dish,
  arConfigured: !!(dish.glb_path && dish.usdz_path),
  arUsage: {
    used: usedAR,
    max: maxAR
  },
  tags,
  dishTags: getDishTags(dish.id)
});

    

    
    
});




router.post(
  "/:slug/dishes/:id/edit",
  requireAdmin,

  (req, res, next) =>
    dishModelUpload(req.params.slug).fields([
      { name: "image", maxCount: 1 },
      { name: "glb", maxCount: 1 },
      { name: "usdz", maxCount: 1 }
    ])(req, res, next),

  (req, res) => {


    const {
      title_fr,
      title_en,
      desc_short_fr,
      desc_short_en,
      desc_long_fr,
      desc_long_en,
      price,
      category,
      subcategory_id,
      availability,
      scale,
      status
    } = req.body;

    const existing = db
    .prepare("SELECT * FROM dishes WHERE id = ? AND restaurant_id = ?")
    .get(req.params.id, req.restaurant.id);

    if (!existing) {
      return res.status(404).send("Plat introuvable");
    }
    
  // 1️⃣ nouvel état AR demandé
  const wantsAR = req.body.has_ar === "1";


// 2️⃣ ancien état
const hadAR =
  existing.has_ar === 1 &&
  existing.status === "published";


// 3️⃣ limite de l’offre
const maxAR = req.restaurant.limits?.maxArDishes ?? 0;


// 4️⃣ SI on essaie d’activer l’AR ET publier
if (
  status === "published" &&
  !hadAR &&
  wantsAR &&
  maxAR > 0
) {
  const { count } = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM dishes
      WHERE restaurant_id = ?
        AND has_ar = 1
        AND status = 'published'
    `)
    .get(req.restaurant.id);

  if (count >= maxAR) {
    return res.status(403).json({
      error: "AR_LIMIT_REACHED",
      maxAR
    });
  }
}


// 5️⃣ valeur finale à enregistrer
const hasAR =
  status === "published" && wantsAR ? 1 : 0;






let imagePath = existing.image_path;
let imageOriginalName = existing.image_original_name;

if (req.files?.image) {
  const file = req.files.image[0];
  imagePath = "/" + file.path;
  imageOriginalName = file.originalname;
}

      
let glbPath = existing.glb_path;
let glbOriginalName = existing.glb_original_name;

if (req.files?.glb) {
  const file = req.files.glb[0];
  glbPath = "/" + file.path;
  glbOriginalName = file.originalname;
}

      
let usdzPath = existing.usdz_path;
let usdzOriginalName = existing.usdz_original_name;

if (req.files?.usdz) {
  const file = req.files.usdz[0];
  usdzPath = "/" + file.path;
  usdzOriginalName = file.originalname;
}

      

        
      db.prepare(`
        UPDATE dishes SET
          title_fr = ?,
          title_en = ?,
          desc_short_fr = ?,
          desc_short_en = ?,
          desc_long_fr = ?,
          desc_long_en = ?,
          price_cents = ?,
          category = ?,
          subcategory_id = ?,
          availability = ?,
          image_path = ?,
          image_original_name = ?,
          glb_path = ?,
          glb_original_name = ?,
          usdz_path = ?,
          usdz_original_name = ?,
          scale = ?,
          status = ?,
          has_ar = ?
        WHERE id = ? AND restaurant_id = ?
      `).run(
        title_fr,
        title_en,
        desc_short_fr,
        desc_short_en,
        desc_long_fr,
        desc_long_en,
        Math.round(price * 100),
        category,
        subcategory_id,
        availability,
        imagePath,
        imageOriginalName,
        glbPath,
        glbOriginalName,
        usdzPath,
        usdzOriginalName,
        scale,
        status,
        hasAR,               
        req.params.id,
        req.restaurant.id
      );

      // ======================
// TAGS (BADGES)
// ======================

const tagIds = req.body.tags
  ? (Array.isArray(req.body.tags)
      ? req.body.tags
      : [req.body.tags]
    ).map(id => parseInt(id, 10)).filter(Boolean)
  : [];


setDishTags(
req.params.id,
tagIds,
req.restaurant.id
);

      
      

    res.redirect(`/admin/${req.params.slug}/dishes`);
  }
);

/* ======================
   TAGS (GLOBAL BADGES)
====================== */

router.post("/:slug/tags", requireAdmin, (req, res) => {
  try {
    createTag(req.restaurant.id, req.body.name);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/:slug/tags/:id/delete", requireAdmin, (req, res) => {
  deleteTag(req.restaurant.id, req.params.id);
  res.sendStatus(200);
});


export default router;