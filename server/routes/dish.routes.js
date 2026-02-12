import express from "express";
import db from "../db/index.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";
import cloudinary, { deleteFromCloudinary } from "../config/cloudinary.js";

import { requireAdminRestaurant } from "../middleware/adminRestaurant.js";
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
router.get("/dishes", requireAdmin,   async (req, res) => {




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
router.get("/dishes/new", requireAdmin,   async (req, res) => {

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
  "/dishes/new",
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "glb", maxCount: 1 },
    { name: "usdz", maxCount: 1 }
  ]),
  

  async (req, res) => {

 
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
let glbPath = null;
let usdzPath = null;

const folder = `restaurants/${req.restaurant.slug}/dishes`;

try {
if (req.files?.image) {
  const result = await uploadToCloudinary(
    req.files.image[0].buffer,
    folder,
    "image"
  );
  imagePath = result.secure_url;
}

if (req.files?.glb) {
  const result = await uploadToCloudinary(
    req.files.glb[0].buffer,
    folder,
    "raw"
  );
  glbPath = result.secure_url;
}

if (req.files?.usdz) {
  const result = await uploadToCloudinary(
    req.files.usdz[0].buffer,
    folder,
    "raw"
  );
  usdzPath = result.secure_url;
}
} catch (err) {
  console.error("UPLOAD ERROR:", err);
  return res.status(500).send("Upload error");
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
        glb_path,
        usdz_path,
        scale,
        status,
        has_ar
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      glbPath,
      usdzPath,
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

    

res.redirect("/admin/dishes");

  }
);


/* ======================
   DELETE
====================== */
router.post(
  "/dishes/:id/delete",
  requireAdminRestaurant,
  async (req, res) => {
    console.log("DELETE ROUTE HIT", req.params.id);
    const dish = db
      .prepare("SELECT * FROM dishes WHERE id=? AND restaurant_id=?")
      .get(req.params.id, req.restaurant.id);

    if (!dish) {
      return res.redirect("/admin/dishes");
    }

    const extractPublicId = (url) => {
      if (!url) return null;

      const parts = url.split("/upload/")[1];
      if (!parts) return null;

      const withoutVersion = parts.replace(/^v\d+\//, "");
      return withoutVersion.replace(/\.[^/.]+$/, "");
    };

    try {

      const imageId = extractPublicId(dish.image_path);
      const glbId = extractPublicId(dish.glb_path);
      const usdzId = extractPublicId(dish.usdz_path);

      if (imageId) await deleteFromCloudinary(imageId, "image");
      if (glbId) await deleteFromCloudinary(glbId, "raw");
      if (usdzId) await deleteFromCloudinary(usdzId, "raw");

    } catch (err) {
      console.error("Cloudinary delete error:", err);
    }

    db.prepare(`
      DELETE FROM dishes
      WHERE id=? AND restaurant_id=?
    `).run(req.params.id, req.restaurant.id);

    res.redirect("/admin/dishes");
  }
);





router.post("/subcategories", requireAdmin, async (req, res) => {



  const { name, category } = req.body;

  db.prepare(`
    INSERT INTO subcategories (restaurant_id, category, name)
    VALUES (?,?,?)
  `).run(req.restaurant.id, category, name);


  res.sendStatus(200);
});


router.get("/dishes/:id/edit", requireAdmin, async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/admin/dishes");

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


const extractPublicId = (url) => {
  if (!url) return null;

  const parts = url.split("/upload/")[1];
  if (!parts) return null;

  const withoutVersion = parts.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^/.]+$/, "");
};

router.post(
  "/dishes/:id/edit",
  requireAdmin,

  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "glb", maxCount: 1 },
    { name: "usdz", maxCount: 1 }
  ]),
  

  async (req, res) => {


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

  const folder = `restaurants/${req.restaurant.slug}/dishes`;

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
  let glbPath = existing.glb_path;
  let usdzPath = existing.usdz_path;
  
  /* ================= IMAGE ================= */
  
  if (req.files?.image) {
  
    const oldPublicId = extractPublicId(existing.image_path);
  
    const result = await uploadToCloudinary(
      req.files.image[0].buffer,
      folder,
      "image"
    );
  
    imagePath = result.secure_url;
  
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId, "image");
      } catch (err) {
        console.error("Old image delete failed:", err);
      }
    }
  }
  
  /* ================= GLB ================= */
  
  if (req.files?.glb) {
  
    const oldPublicId = extractPublicId(existing.glb_path);
  
    const result = await uploadToCloudinary(
      req.files.glb[0].buffer,
      folder,
      "raw"
    );
  
    glbPath = result.secure_url;
  
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId, "raw");
      } catch (err) {
        console.error("Old GLB delete failed:", err);
      }
    }
  }
  
  /* ================= USDZ ================= */
  
  if (req.files?.usdz) {
  
    const oldPublicId = extractPublicId(existing.usdz_path);
  
    const result = await uploadToCloudinary(
      req.files.usdz[0].buffer,
      folder,
      "raw"
    );
  
    usdzPath = result.secure_url;
  
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId, "raw");
      } catch (err) {
        console.error("Old USDZ delete failed:", err);
      }
    }
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
    glb_path = ?,
    usdz_path = ?,
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
  glbPath,
  usdzPath,
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

      
      

res.redirect("/admin/dishes");

  }
);

/* ======================
   TAGS (GLOBAL BADGES)
====================== */

router.post("/tags", requireAdmin,   async (req, res) => {
  try {
    createTag(req.restaurant.id, req.body.name);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/tags/:id/delete", requireAdmin,   async (req, res) => {
  deleteTag(req.restaurant.id, req.params.id);
  res.sendStatus(200);
});


export default router;