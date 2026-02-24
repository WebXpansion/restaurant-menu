export const PLANS = {
  offer_1: {
    label: "Découverte",

    maxArDishes: 10,
    languages: ["fr", "en"],

    hasStats: false,
    hasGoogleReviews: false,
    hasShare: false,
    hasPublication: true,
    hasAdvancedMenus: false,
    hasAdvancedDishStats: false
  },

  offer_2: {
    label: "Croissance",

    maxArDishes: 20,
    languages: ["fr", "en", "es", "it"],

    hasStats: true,
    hasGoogleReviews: true,
    hasShare: false,
    hasPublication: true,
    hasAdvancedMenus: true,
    hasAdvancedDishStats: false
  },

  offer_3: {
    label: "Excellence",

    maxArDishes: Infinity,
    languages: ["fr", "en", "es", "it", "de", "pt", "nl", "jp", "cn", "ar"],

    hasStats: true,
    hasGoogleReviews: true,
    hasShare: true,
    hasPublication: true,
    hasAdvancedMenus: true,
    hasAdvancedDishStats: true
  }
};