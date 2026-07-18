/**
 * data.js — Frontend display constants for Thirst.
 * (menu, users, coupons & payment logic now live in the backend/DB)
 */

const CATEGORIES = [
  'All',
  'Signature',
  'Kunafa Specials',
  'Fruit Pops',
  'Chocolate & Nutty',
  'Kulfi Classics',
  'Shakes & Sips'
];



const PROMO_OFFERS = [
  { text: 'Flat 20% off your first order — code SWEET20', icon: '🍦' },
  { text: 'Free delivery on orders above ₹499', icon: '🚚' },
  { text: 'Now open in Thiruvallur — Kunafa treats are here!', icon: '🎉' }
];

const TESTIMONIALS = [
  {
    name: 'Divya Ramesh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    rating: 5,
    text: 'The Kunafa is unreal — crispy, creamy, and that chocolate drizzle! Easily the best dessert in Thiruvallur right now.'
  },
  {
    name: 'Karthik S',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    rating: 5,
    text: 'Took the whole family for the grand opening. Fresh fruit pops, zero artificial taste, and super friendly staff. We are regulars now!'
  },
  {
    name: 'Aishwarya M',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    rating: 4,
    text: 'Loved the Alphonso Mango and Malai Kulfi pops. Ordering online was quick and delivery was still frozen solid. Highly recommend!'
  }
];

const OUTLETS = [
  {
    city: 'Thiruvallur (Flagship)',
    address: 'No. 01, Siva Vishnu Kovil Street, Kakkalur, Thiruvallur – 602 001',
    phone: '+91 98409 12345',
    hours: '12:00 PM – 11:00 PM'
  },
  {
    city: 'Avadi',
    address: '24 Poonamallee High Road, Avadi, Chennai 600054',
    phone: '+91 98409 12346',
    hours: '12:00 PM – 11:00 PM'
  },
  {
    city: 'Poonamallee',
    address: '9 Trunk Road, Poonamallee, Chennai 600056',
    phone: '+91 98409 12347',
    hours: '12:00 PM – 11:30 PM'
  }
];

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=80',
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80',
  'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=80',
  'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=600&q=80',
  'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=600&q=80',
  'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80'
];

const WHY_CHOOSE_US = [
  { icon: '🍓', title: '100% Natural', desc: 'Real fruit and premium ingredients — no artificial colors.' },
  { icon: '🧑‍🍳', title: 'Handcrafted Daily', desc: 'Every treat is made fresh in small batches, right here.' },
  { icon: '❄️', title: 'Frozen Fresh', desc: 'Delivered chilled and frozen solid to your doorstep.' },
  { icon: '🍦', title: '24+ Flavors', desc: 'From Kunafa to Kulfi — a story for every craving.' }
];
