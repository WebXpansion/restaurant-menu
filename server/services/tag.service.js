import db from "../db/index.js";

/* =========================
   GET TAGS BY RESTAURANT
========================= */
export function getTagsByRestaurant(restaurantId) {
  return db.prepare(`
    SELECT *
    FROM tags
    WHERE restaurant_id = ?
    ORDER BY name ASC
  `).all(restaurantId);
}


/* =========================
   CREATE TAG
========================= */
export function createTag(restaurantId, name) {

  if (!name || name.trim().length === 0) {
    throw new Error("INVALID_NAME");
  }

  const words = name.trim().split(/\s+/);
  if (words.length > 5) {
    throw new Error("MAX_5_WORDS");
  }

  return db.prepare(`
    INSERT INTO tags (restaurant_id, name)
    VALUES (?, ?)
  `).run(restaurantId, name.trim());
}


/* =========================
   DELETE TAG
========================= */
export function deleteTag(restaurantId, tagId) {

  db.prepare(`
    DELETE FROM tags
    WHERE id = ? AND restaurant_id = ?
  `).run(tagId, restaurantId);

  db.prepare(`
    DELETE FROM dishes_pastilles
    WHERE tag_id = ?
  `).run(tagId);
}


/* =========================
   GET DISH TAGS
========================= */
export function getDishTags(dishId) {
  return db.prepare(`
    SELECT tag_id
    FROM dishes_pastilles
    WHERE dish_id = ?
  `).all(dishId).map(row => row.tag_id);
}


/* =========================
   SET DISH TAGS
========================= */
export function setDishTags(dishId, tagIds, restaurantId) {

  if (tagIds.length > 5) {
    throw new Error("MAX_5_TAGS");
  }

  // Supprime anciennes liaisons
  db.prepare(`
    DELETE FROM dishes_pastilles
    WHERE dish_id = ?
  `).run(dishId);

  const insert = db.prepare(`
    INSERT INTO dishes_pastilles
    (dish_id, tag_id, restaurant_id)
    VALUES (?, ?, ?)
  `);

  for (const id of tagIds) {

    const exists = db.prepare(`
      SELECT id FROM tags
      WHERE id = ? AND restaurant_id = ?
    `).get(id, restaurantId);

    if (exists) {
      insert.run(dishId, id, restaurantId);
    }
  }
}