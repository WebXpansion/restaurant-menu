import { PLANS } from "../config/plans.js";

export function resolveRestaurantPlan(restaurant) {

  restaurant.plan = restaurant.plan || "offer_1";

  const planConfig = PLANS[restaurant.plan];

  if (!planConfig) {
    throw new Error("Invalid plan configuration");
  }

  // 🔥 NOUVEAU → label plan pour affichage
  restaurant.planLabel = planConfig.label;

  // 🔥 OPTIONNEL MAIS PRO → garder config complète
  restaurant.planConfig = planConfig;

  restaurant.features = {
    stats: planConfig.hasStats,
    googleReview: planConfig.hasGoogleReviews,
    share: planConfig.hasShare,
    publication: planConfig.hasPublication,
    advancedMenus: planConfig.hasAdvancedMenus,
    advancedDishStats: planConfig.hasAdvancedDishStats
  };

  restaurant.limits = {
    ar_limit: planConfig.maxArDishes
  };

  restaurant.languages = planConfig.languages;

  return restaurant;
}