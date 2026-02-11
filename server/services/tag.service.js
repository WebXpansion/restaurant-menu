import db from "../db/index.js";

export function getTagsByRestaurant(restaurantId) {
  return db.prepare(`
    SELECT * FROM pastilles
    WHERE restaurant_id = ?
    ORDER BY name
  `).all(restaurantId);
}

export function createTag(restaurantId, name) {
  if (!name || name.trim().length === 0) {
    throw new Error("INVALID_NAME");
  }

  const words = name.trim().split(/\s+/);
  if (words.length > 5) {
    throw new Error("MAX_5_WORDS");
  }

  return db.prepare(`
    INSERT INTO pastilles (restaurant_id, name)
    VALUES (?, ?)
  `).run(restaurantId, name.trim());
}

export function deleteTag(restaurantId, tagId) {
  db.prepare(`
    DELETE FROM pastilles
    WHERE id = ? AND restaurant_id = ?
  `).run(tagId, restaurantId);

  db.prepare(`
    DELETE FROM dishes_pastilles
    WHERE pastille_id = ?
  `).run(tagId);
}

export function getDishTags(dishId) {
  return db.prepare(`
    SELECT p.*
    FROM pastilles p
    JOIN dishes_pastilles dp ON dp.pastille_id = p.id
    WHERE dp.dish_id = ?
  `).all(dishId);
}

export function setDishTags(dishId, tagIds, restaurantId) {

  if (tagIds.length > 5) {
    throw new Error("MAX_5_TAGS");
  }

  db.prepare(`
    DELETE FROM dishes_pastilles
    WHERE dish_id = ?
  `).run(dishId);

  const insert = db.prepare(`
    INSERT INTO dishes_pastilles (dish_id, pastille_id)
    VALUES (?, ?)
  `);

  for (const id of tagIds) {
    const exists = db.prepare(`
      SELECT id FROM pastilles
      WHERE id = ? AND restaurant_id = ?
    `).get(id, restaurantId);

    if (exists) {
      insert.run(dishId, id);
    }
  }
}
