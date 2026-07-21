/**
 * data.ts — Frontend display constants for Thirst.
 * (menu, users, coupons & payment logic live in the backend/DB)
 */

export const CATEGORIES = [
  "All",
  "Hot Chocolate",
  "Crushers",
  "Shakes",
  "Waffles",
  "Pancakes",
  "Brownies & Cakes",
  "Maggi",
  "Combos",
  "Students Special",
];

export const PROMO_OFFERS = [
  { text: "Open daily — 5 PM to 10 PM", icon: "🕔" },
  { text: "Student Offer — flat 50% off select combos", icon: "🎓" },
  { text: "Takeaway? Just ₹5 more!", icon: "🥤" },
];

export const OUTLETS = [
  {
    city: "Thirst. — Flagship",
    address: "No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001",
    phone: "+91 85250 03546",
    hours: "5:00 PM – 10:00 PM (Daily)",
  },
];

export const WHY_CHOOSE_US = [
  { icon: "🍫", title: "Rich & Real", desc: "Premium chocolate, Nutella, Biscoff & Milo — no shortcuts." },
  { icon: "🧇", title: "Made Fresh", desc: "Waffles, pancakes & brownies made hot, to order." },
  { icon: "🎓", title: "Student Friendly", desc: "Special combos and student pricing, every day." },
  { icon: "🕔", title: "Open Late", desc: "Sweet cravings sorted daily, 5 PM to 10 PM." },
];

export const STORE = {
  name: "Thirst.",
  tagline: "One for Living",
  address: "No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001",
  phone: "+91 85250 03546",
  fssai: "22425478001152",
  // Thirst. is not GST-registered (Udyam UDYAM-TN-24-0161809 declares no GSTIN,
  // and turnover sits under the registration threshold), so no tax is collected.
  // Set this to a rate only if a GSTIN is obtained.
  gstRate: 0,
};
