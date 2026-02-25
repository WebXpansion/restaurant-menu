import express from "express";
import { getPool } from "../db/postgres.js";
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
router.get("/dishes", requireAdmin, async (req, res) => {

  const pool = getPool();
  const lang = req.restaurant.languages[0];

  const { rows: dishes } = await pool.query(
    `
      SELECT
        d.*,
        dt.title
      FROM dishes d
      LEFT JOIN dish_translations dt
        ON dt.dish_id = d.id
        AND dt.language = $1
      WHERE d.restaurant_id = $2
    `,
    [lang, req.restaurant.id]
  );

  const maxAR = req.restaurant.limits?.ar_limit ?? 0;

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM dishes
      WHERE restaurant_id = $1
        AND has_ar = true
        AND status = 'published'
    `,
    [req.restaurant.id]
  );

  const usedAR = rows[0]?.count || 0;

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
router.get("/dishes/new", requireAdmin, async (req, res) => {

  const pool = getPool();

  const { rows: subcategories } = await pool.query(
    `
      SELECT *
      FROM subcategories
      WHERE restaurant_id = $1
      ORDER BY name
    `,
    [req.restaurant.id]
  );

  const maxAR = req.restaurant.limits?.ar_limit ?? 0;

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM dishes
      WHERE restaurant_id = $1
        AND has_ar = true
        AND status = 'published'
    `,
    [req.restaurant.id]
  );

  const usedAR = rows[0]?.count || 0;

  const tags = await getTagsByRestaurant(req.restaurant.id);

  res.render("admin/dish-form", {
    restaurant: req.restaurant,
    subcategories,
    dish: null,
    translations: {},
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

    const pool = getPool();

    const {
      price,
      category,
      subcategory_id,
      status
    } = req.body;

    let availability = req.body.availability;

    const allowedAvailability = ["both", "lunch", "dinner"];
    if (req.restaurant.features?.advancedMenus) {
      allowedAvailability.push("events", "seasonal");
    }

    if (!allowedAvailability.includes(availability)) {
      availability = "both";
    }

    const cleanSubcategoryId = subcategory_id || null;

    const finalStatus = status || "published";

    const wantsAR =
      req.body.has_ar === "1" ||
      !!req.files?.glb ||
      !!req.files?.usdz;

    const hasAR =
      finalStatus === "published" && wantsAR;

    // 🔥 Vérification limite AR (Postgres)
    const maxAR = req.restaurant.limits?.ar_limit ?? 0;

    if (finalStatus === "published" && wantsAR && maxAR > 0) {

      const { rows } = await pool.query(
        `
          SELECT COUNT(*)::int AS count
          FROM dishes
          WHERE restaurant_id = $1
            AND has_ar = true
            AND status = 'published'
        `,
        [req.restaurant.id]
      );

      if (rows[0].count >= maxAR) {
        return res.status(403).json({
          error: "AR_LIMIT_REACHED",
          maxAR
        });
      }
    }

    /* ======================
       FILES
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
       INSERT DISH
    ====================== */

    const { rows: insertRows } = await pool.query(
      `
        INSERT INTO dishes (
          restaurant_id,
          price_cents,
          category,
          subcategory_id,
          availability,
          image_url,
          glb_url,
          usdz_url,
          scale,
          status,
          has_ar
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id
      `,
      [
        req.restaurant.id,
        Math.round(price * 100),
        category,
        cleanSubcategoryId,
        availability,
        imagePath,
        glbPath,
        usdzPath,
        scale,
        finalStatus,
        hasAR
      ]
    );

    const dishId = insertRows[0].id;

    /* ======================
       TRANSLATIONS
    ====================== */

    const languages = req.restaurant.languages;

    for (const lang of languages) {

      const title = req.body[`title_${lang}`] || "";
      const desc = req.body[`desc_short_${lang}`] || "";

      await pool.query(
        `
          INSERT INTO dish_translations
          (dish_id, language, title, desc_short)
          VALUES ($1,$2,$3,$4)
        `,
        [dishId, lang, title, desc]
      );
    }

    /* ======================
       TAGS
    ====================== */

    const tagIds = req.body.tags
      ? (Array.isArray(req.body.tags)
          ? req.body.tags
          : [req.body.tags]
        ).map(id => parseInt(id, 10)).filter(Boolean)
      : [];

    await setDishTags(dishId, tagIds, req.restaurant.id);

    res.json({ success: true });

  }
);


/* ======================
   DELETE
====================== */
router.post(
  "/dishes/:id/delete",
  requireAdminRestaurant,
  async (req, res) => {

    const pool = getPool();

    /* ======================
       1️⃣ Récupérer le plat
    ====================== */

    const { rows } = await pool.query(
      `
        SELECT *
        FROM dishes
        WHERE id = $1
          AND restaurant_id = $2
      `,
      [req.params.id, req.restaurant.id]
    );

    const dish = rows[0];

    if (!dish) {
      return res.redirect("/admin/dishes");
    }

    /* ======================
       2️⃣ Supprimer fichiers Cloudinary
    ====================== */

    const extractPublicId = (url) => {
      if (!url) return null;

      const parts = url.split("/upload/")[1];
      if (!parts) return null;

      const withoutVersion = parts.replace(/^v\d+\//, "");
      return withoutVersion.replace(/\.[^/.]+$/, "");
    };

    try {

      const imageId = extractPublicId(dish.image_url);
      const glbId = extractPublicId(dish.glb_url);
      const usdzId = extractPublicId(dish.usdz_url);

      if (imageId) await deleteFromCloudinary(imageId, "image");
      if (glbId) await deleteFromCloudinary(glbId, "raw");
      if (usdzId) await deleteFromCloudinary(usdzId, "raw");

    } catch (err) {
      console.error("Cloudinary delete error:", err);
    }

    /* ======================
       3️⃣ Supprimer en DB
    ====================== */

    await pool.query(
      `
        DELETE FROM dishes
        WHERE id = $1
          AND restaurant_id = $2
      `,
      [req.params.id, req.restaurant.id]
    );

    res.redirect("/admin/dishes");
  }
);





router.post("/subcategories", requireAdmin, async (req, res) => {

  const pool = getPool();
  const { name, category } = req.body;

  await pool.query(`
    INSERT INTO subcategories (restaurant_id, category, name)
    VALUES ($1, $2, $3)
  `, [req.restaurant.id, category, name]);

  res.sendStatus(200);
});


router.get("/dishes/:id/edit", requireAdmin, async (req, res) => {

  const pool = getPool();

  const { rows: dishRows } = await pool.query(
    `
      SELECT *
      FROM dishes
      WHERE id = $1
        AND restaurant_id = $2
    `,
    [req.params.id, req.restaurant.id]
  );

  const dish = dishRows[0];

  if (!dish) return res.redirect("/admin/dishes");

  const { rows: translations } = await pool.query(
    `
      SELECT language, title, desc_short
      FROM dish_translations
      WHERE dish_id = $1
    `,
    [dish.id]
  );

  const translationsMap = {};
  translations.forEach(t => {
    translationsMap[t.language] = {
      title: t.title,
      desc_short: t.desc_short
    };
  });

  const { rows: subcategories } = await pool.query(
    `
      SELECT *
      FROM subcategories
      WHERE restaurant_id = $1
      ORDER BY name
    `,
    [req.restaurant.id]
  );

  const maxAR = req.restaurant.limits?.ar_limit ?? 0;

  const { rows: countRows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM dishes
      WHERE restaurant_id = $1
        AND has_ar = true
        AND status = 'published'
    `,
    [req.restaurant.id]
  );

  const usedAR = countRows[0]?.count || 0;

  const tags = await getTagsByRestaurant(req.restaurant.id);

  const dishTags = await getDishTags(dish.id);

  res.render("admin/dish-form", {
    restaurant: req.restaurant,
    subcategories,
    dish,
    translations: translationsMap,
    arConfigured: !!(dish.glb_url && dish.usdz_url),
    arUsage: {
      used: usedAR,
      max: maxAR
    },
    tags,
    dishTags
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

    const pool = getPool();

    const {
      price,
      category,
      subcategory_id,
      scale,
      status
    } = req.body;

    /* ======================
       1️⃣ Get existing dish
    ====================== */

    const { rows: dishRows } = await pool.query(
      `
        SELECT *
        FROM dishes
        WHERE id = $1
          AND restaurant_id = $2
      `,
      [req.params.id, req.restaurant.id]
    );

    const existing = dishRows[0];

    if (!existing) {
      return res.status(404).send("Plat introuvable");
    }

    /* ======================
       2️⃣ Availability
    ====================== */

    let availability = req.body.availability;

    const allowedAvailability = ["both", "lunch", "dinner"];

    if (req.restaurant.features?.advancedMenus) {
      allowedAvailability.push("events", "seasonal");
    }

    if (!allowedAvailability.includes(availability)) {
      availability = existing.availability;
    }

    const cleanSubcategoryId = subcategory_id || null;

    /* ======================
       3️⃣ AR LOGIC
    ====================== */

    const wantsAR = req.body.has_ar === "1";

    const hadAR =
      existing.has_ar === true &&
      existing.status === "published";

    const maxAR = req.restaurant.limits?.ar_limit ?? 0;

    if (
      status === "published" &&
      !hadAR &&
      wantsAR &&
      maxAR > 0
    ) {
      const { rows } = await pool.query(
        `
          SELECT COUNT(*)::int AS count
          FROM dishes
          WHERE restaurant_id = $1
            AND has_ar = true
            AND status = 'published'
        `,
        [req.restaurant.id]
      );

      if (rows[0].count >= maxAR) {
        return res.status(403).json({
          error: "AR_LIMIT_REACHED",
          maxAR
        });
      }
    }

    const hasAR =
      status === "published" && wantsAR;

    /* ======================
       4️⃣ FILES
    ====================== */

    let imagePath = existing.image_url;
    let glbPath = existing.glb_url;
    let usdzPath = existing.usdz_url;

    const folder = `restaurants/${req.restaurant.slug}/dishes`;

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

    /* ======================
       5️⃣ UPDATE DISH
    ====================== */

    await pool.query(
      `
        UPDATE dishes SET
          price_cents = $1,
          category = $2,
          subcategory_id = $3,
          availability = $4,
          image_url = $5,
          glb_url = $6,
          usdz_url = $7,
          scale = $8,
          status = $9,
          has_ar = $10,
          updated_at = NOW()
        WHERE id = $11
          AND restaurant_id = $12
      `,
      [
        Math.round(price * 100),
        category,
        cleanSubcategoryId,
        availability,
        imagePath,
        glbPath,
        usdzPath,
        scale,
        status,
        hasAR,
        req.params.id,
        req.restaurant.id
      ]
    );

    /* ======================
       6️⃣ TRANSLATIONS
    ====================== */

    const languages = req.restaurant.languages;

    for (const lang of languages) {

      const title = req.body[`title_${lang}`] || "";
      const desc = req.body[`desc_short_${lang}`] || "";

      await pool.query(
        `
          INSERT INTO dish_translations
          (dish_id, language, title, desc_short)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (dish_id, language)
          DO UPDATE SET
            title = EXCLUDED.title,
            desc_short = EXCLUDED.desc_short
        `,
        [req.params.id, lang, title, desc]
      );
    }

    /* ======================
       7️⃣ TAGS
    ====================== */

    const tagIds = req.body.tags
      ? (Array.isArray(req.body.tags)
          ? req.body.tags
          : [req.body.tags]
        ).map(id => parseInt(id, 10)).filter(Boolean)
      : [];

    await setDishTags(req.params.id, tagIds, req.restaurant.id);

    res.json({ success: true });

  }
);

/* ======================
   TAGS (GLOBAL BADGES)
====================== */

router.post("/tags", requireAdmin,   async (req, res) => {
  try {
    await createTag(req.restaurant.id, req.body.name);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/tags/:id/delete", requireAdmin,   async (req, res) => {
  await deleteTag(req.restaurant.id, req.params.id);
  res.sendStatus(200);
});


export default router;