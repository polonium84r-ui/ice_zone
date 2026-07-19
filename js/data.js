/**
 * data.js — Frontend display constants for Thirst.
 * (menu, users, coupons & payment logic now live in the backend/DB)
 */

const CATEGORIES = [
  'All',
  'Hot Chocolate',
  'Crushers',
  'Shakes',
  'Waffles',
  'Pancakes',
  'Brownies & Cakes',
  'Maggi',
  'Combos'
];



const PROMO_OFFERS = [
  { text: 'Open daily — 5 PM to 10 PM', icon: '🕔' },
  { text: 'Student Offer — flat 50% off select combos', icon: '🎓' },
  { text: 'Takeaway? Just ₹5 more!', icon: '🥤' }
];

const TESTIMONIALS = [
  {
    name: 'Divya Ramesh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    rating: 5,
    text: 'The Signature Sip is unreal — Milo, marshmallows, biscuit crunch, all in one cup. My new evening ritual!'
  },
  {
    name: 'Karthik S',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    rating: 5,
    text: 'Loaded waffles and thick shakes done right. The Lotus Biscoff waffle is a must-try, and the staff are so friendly.'
  },
  {
    name: 'Aishwarya M',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    rating: 4,
    text: 'Great student combos and the boba shakes are so good. Perfect after-college hangout for dessert.'
  }
];

const OUTLETS = [
  {
    city: 'Thirst. — Flagship',
    address: 'No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001',
    phone: '+91 85250 03546',
    hours: '5:00 PM – 10:00 PM (Daily)'
  }
];

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&q=80',
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80'
];

const WHY_CHOOSE_US = [
  { icon: '🍫', title: 'Rich & Real', desc: 'Premium chocolate, Nutella, Biscoff & Milo — no shortcuts.' },
  { icon: '🧇', title: 'Made Fresh', desc: 'Waffles, pancakes & brownies made hot, to order.' },
  { icon: '🎓', title: 'Student Friendly', desc: 'Special combos and student pricing, every day.' },
  { icon: '🕔', title: 'Open Late', desc: 'Sweet cravings sorted daily, 5 PM to 10 PM.' }
];
