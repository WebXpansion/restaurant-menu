import { getPool } from "../db/postgres.js";

/* =========================
   GET TAGS BY RESTAURANT
========================= */
export async function getTagsByRestaurant(restaurantId) {

  const pool = getPool();

  const { rows } = await pool.query(`
    SELECT *
    FROM tags
    WHERE restaurant_id = $1
    ORDER BY name ASC
  `, [restaurantId]);

  return rows;
}


/* =========================
   CREATE TAG
========================= */
export async function createTag(restaurantId, name) {

  if (!name || name.trim().length === 0) {
    throw new Error("INVALID_NAME");
  }

  const words = name.trim().split(/\s+/);
  if (words.length > 5) {
    throw new Error("MAX_5_WORDS");
  }

  const pool = getPool();

  await pool.query(`
    INSERT INTO tags (restaurant_id, name)
    VALUES ($1, $2)
  `, [restaurantId, name.trim()]);
}


/* =========================
   DELETE TAG
========================= */
export async function deleteTag(restaurantId, tagId) {

  const pool = getPool();

  await pool.query(`
    DELETE FROM tags
    WHERE id = $1 AND restaurant_id = $2
  `, [tagId, restaurantId]);

  await pool.query(`
    DELETE FROM dish_tags
    WHERE tag_id = $1
  `, [tagId]);
}


/* =========================
   GET DISH TAGS
========================= */
export async function getDishTags(dishId) {

  const pool = getPool();

  const { rows } = await pool.query(`
    SELECT tag_id
    FROM dish_tags
    WHERE dish_id = $1
  `, [dishId]);

  return rows.map(row => row.tag_id);
}


/* =========================
   SET DISH TAGS
========================= */
export async function setDishTags(dishId, tagIds, restaurantId) {

  if (tagIds.length > 5) {
    throw new Error("MAX_5_TAGS");
  }

  const pool = getPool();

  // Supprimer anciennes liaisons
  await pool.query(`
    DELETE FROM dish_tags
    WHERE dish_id = $1
  `, [dishId]);

  for (const id of tagIds) {

    const { rows } = await pool.query(`
      SELECT id
      FROM tags
      WHERE id = $1 AND restaurant_id = $2
    `, [id, restaurantId]);

    if (rows[0]) {
      await pool.query(`
        INSERT INTO dish_tags (dish_id, tag_id, restaurant_id)
        VALUES ($1, $2, $3)
      `, [dishId, id, restaurantId]);
    }
  }
}