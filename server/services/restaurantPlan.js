import { PLANS } from "../config/plans.js";

export function resolveRestaurantPlan(restaurant) {

  restaurant.plan = restaurant.plan || "offer_1";

  const planConfig = PLANS[restaurant.plan];

  if (!planConfig) {
    throw new Error("Invalid plan configuration");
  }

  restaurant.features = {
    stats: planConfig.hasStats,
    googleReview: planConfig.hasGoogleReviews,
    share: planConfig.hasShare 
  };

  restaurant.limits = {
    ar_limit: planConfig.maxArDishes
  };

  restaurant.languages = planConfig.languages;

  return restaurant;
}