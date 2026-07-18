/**
 * seed.js — Idempotent seed for the Thirst. database.
 * Safe to run repeatedly: only inserts rows that don't already exist.
 * Run: npm run seed
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

const MENU = [
  { name: 'Kunafa', category: 'Signature', description: 'Crispy golden kunafa wrapped around creamy vanilla custard, drizzled with Belgian chocolate and crushed pistachios.', price: 180, image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=80', rating: 4.9, review_count: 412, is_veg: 1, tags: ['bestseller', 'popular', 'signature'] },
  { name: 'Strawberry Orange Blast', category: 'Signature', description: 'Our star treat — creamy vanilla draped in dark chocolate, fresh strawberry, and a zesty orange slice.', price: 150, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80', rating: 4.8, review_count: 356, is_veg: 1, tags: ['popular', 'signature'] },
  { name: 'Triple Chocolate Truffle', category: 'Signature', description: 'A decadent chocolate treat loaded with dark, milk, and white chocolate drizzle.', price: 160, image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=80', rating: 4.7, review_count: 231, is_veg: 1, tags: ['chocolate', 'popular'] },
  { name: 'Rainbow Sprinkle Dream', category: 'Signature', description: 'Vanilla cream treat rolled in rainbow sprinkles and candy crunch — a kids favorite.', price: 120, image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80', rating: 4.6, review_count: 189, is_veg: 1, tags: ['kids', 'popular'] },
  { name: 'Pistachio Kunafa', category: 'Kunafa Specials', description: 'Crunchy kunafa and pistachio cream finished with a hint of rose syrup.', price: 190, image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=600&q=80', rating: 4.8, review_count: 167, is_veg: 1, tags: ['premium'] },
  { name: 'Nutella Kunafa', category: 'Kunafa Specials', description: 'Golden kunafa with a molten Nutella core and a chocolate-hazelnut drizzle.', price: 200, image: 'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=600&q=80', rating: 4.9, review_count: 278, is_veg: 1, tags: ['premium', 'bestseller'] },
  { name: 'Biscoff Kunafa', category: 'Kunafa Specials', description: 'Kunafa layered with Lotus Biscoff spread and a caramelised biscuit crumble.', price: 200, image: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&q=80', rating: 4.8, review_count: 203, is_veg: 1, tags: ['premium', 'popular'] },
  { name: 'Alphonso Mango', category: 'Fruit Pops', description: 'Real Alphonso mango pulp churned into a fruity pop — no artificial colours.', price: 90, image: 'https://images.unsplash.com/photo-1590080875515-8a3f8f1d1e0e?w=600&q=80', rating: 4.7, review_count: 245, is_veg: 1, tags: ['healthy', 'popular'] },
  { name: 'Fresh Strawberry', category: 'Fruit Pops', description: 'Hand-picked strawberries blended into a bright, refreshing fruit treat.', price: 90, image: 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=600&q=80', rating: 4.6, review_count: 178, is_veg: 1, tags: ['healthy'] },
  { name: 'Watermelon Mint', category: 'Fruit Pops', description: 'Juicy watermelon with a cool hint of fresh mint — summer on a stick.', price: 80, image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&q=80', rating: 4.5, review_count: 142, is_veg: 1, tags: ['refreshing'] },
  { name: 'Mixed Berry', category: 'Fruit Pops', description: 'A medley of blueberry, raspberry, and blackberry frozen into one vibrant pop.', price: 100, image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&q=80', rating: 4.6, review_count: 156, is_veg: 1, tags: ['healthy'] },
  { name: 'Tender Coconut', category: 'Fruit Pops', description: 'Creamy tender coconut with real malai bits — a local favorite.', price: 90, image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=600&q=80', rating: 4.7, review_count: 198, is_veg: 1, tags: ['popular'] },
  { name: 'Belgian Dark Chocolate', category: 'Chocolate & Nutty', description: 'Intense 70% Belgian dark chocolate treat for the true chocolate lover.', price: 130, image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=80', rating: 4.8, review_count: 267, is_veg: 1, tags: ['chocolate', 'popular'] },
  { name: 'Almond Rocher', category: 'Chocolate & Nutty', description: 'Chocolate-hazelnut treat coated in roasted almonds and crunchy praline.', price: 150, image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=600&q=80', rating: 4.8, review_count: 221, is_veg: 1, tags: ['premium'] },
  { name: 'Cookies & Cream', category: 'Chocolate & Nutty', description: 'Vanilla cream treat loaded with chocolate cookie crunch in every bite.', price: 120, image: 'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=600&q=80', rating: 4.7, review_count: 289, is_veg: 1, tags: ['popular'] },
  { name: 'Peanut Butter Fudge', category: 'Chocolate & Nutty', description: 'Creamy peanut butter swirl ribboned with rich chocolate fudge.', price: 130, image: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&q=80', rating: 4.6, review_count: 134, is_veg: 1, tags: ['nutty'] },
  { name: 'Malai Kulfi Pop', category: 'Kulfi Classics', description: 'Slow-cooked reduced milk with cardamom and saffron on a stick.', price: 80, image: 'https://images.unsplash.com/photo-1590080875515-8a3f8f1d1e0e?w=600&q=80', rating: 4.8, review_count: 312, is_veg: 1, tags: ['classic', 'popular'] },
  { name: 'Kesar Pista Kulfi', category: 'Kulfi Classics', description: 'Traditional saffron and pistachio kulfi, rich and aromatic.', price: 100, image: 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=600&q=80', rating: 4.7, review_count: 254, is_veg: 1, tags: ['classic'] },
  { name: 'Rose Falooda Pop', category: 'Kulfi Classics', description: 'Rose syrup, vermicelli, and basil seeds frozen into a nostalgic treat.', price: 110, image: 'https://images.unsplash.com/photo-1464347744102-11db6282f854?w=600&q=80', rating: 4.6, review_count: 143, is_veg: 1, tags: ['classic'] },
  { name: 'Paan Kulfi', category: 'Kulfi Classics', description: 'Betel-leaf flavoured kulfi with gulkand — a refreshing desi delight.', price: 90, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80', rating: 4.5, review_count: 121, is_veg: 1, tags: ['classic'] },
  { name: 'Chocolate Thick Shake', category: 'Shakes & Sips', description: 'A blended chocolate shake topped with whipped cream and shavings.', price: 120, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80', rating: 4.7, review_count: 187, is_veg: 1, tags: ['popular'] },
  { name: 'Strawberry Milkshake', category: 'Shakes & Sips', description: 'Thick, creamy strawberry shake made with real fruit and a scoop of ice cream.', price: 110, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', rating: 4.6, review_count: 165, is_veg: 1, tags: [] },
  { name: 'Filter Coffee Frappe', category: 'Shakes & Sips', description: 'Chilled South-Indian filter coffee frappe with a light cream float.', price: 99, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', rating: 4.7, review_count: 208, is_veg: 1, tags: ['popular'] },
  { name: 'Rose Milk', category: 'Shakes & Sips', description: 'Classic chilled rose milk — cool, fragrant, and comforting.', price: 70, image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80', rating: 4.5, review_count: 132, is_veg: 1, tags: [] }
];

const COUPONS = [
  { code: 'SWEET20', type: 'percentage', value: 20, max_discount: 100, min_order: 0, category: null, description: '20% off your first sweet treat', active: 1 },
  { code: 'FLAT50', type: 'flat', value: 50, max_discount: null, min_order: 299, category: null, description: '₹50 off on orders above ₹299', active: 1 },
  { code: 'KUNAFA10', type: 'percentage', value: 10, max_discount: null, min_order: 0, category: 'Kunafa Specials', description: '10% off all Kunafa Specials', active: 1 }
];

const USERS = [
  { id: 'admin-001', name: 'Admin User', email: 'admin@thirst.in', password: 'Admin@123', phone: '9999999999', role: 'admin', reward_points: 0 },
  { id: 'staff-001', name: 'Priya (Counter)', email: 'staff@thirst.in', password: 'Staff@123', phone: '9888800000', role: 'staff', reward_points: 0 }
];

const insertMenu = db.prepare(`INSERT INTO menu_items (name, category, description, price, image, rating, review_count, is_veg, tags, available)
  VALUES (@name, @category, @description, @price, @image, @rating, @review_count, @is_veg, @tags, 1)`);
const insertCoupon = db.prepare(`INSERT INTO coupons (code, type, value, max_discount, min_order, category, description, active)
  VALUES (@code, @type, @value, @max_discount, @min_order, @category, @description, @active)`);
const insertUser = db.prepare(`INSERT INTO users (id, name, email, password_hash, phone, role, reward_points, active, created_by)
  VALUES (@id, @name, @email, @password_hash, @phone, @role, @reward_points, 1, 'system')`);

const menuCount = db.prepare('SELECT COUNT(*) c FROM menu_items').get().c;
if (menuCount === 0) {
  const tx = db.transaction(() => MENU.forEach(m => insertMenu.run({ ...m, tags: JSON.stringify(m.tags) })));
  tx();
  console.log(`Seeded ${MENU.length} menu items.`);
} else {
  console.log(`Menu already has ${menuCount} items — skipping.`);
}

for (const c of COUPONS) {
  const exists = db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(c.code);
  if (!exists) { insertCoupon.run(c); console.log(`Seeded coupon ${c.code}.`); }
}

for (const u of USERS) {
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(u.email);
  if (!exists) {
    insertUser.run({ ...u, password_hash: bcrypt.hashSync(u.password, 10) });
    console.log(`Seeded ${u.role} user: ${u.email}`);
  }
}

// The customer role has been removed permanently. Purge any legacy customer
// accounts so they can no longer sign in (idempotent — safe to re-run).
const purged = db.prepare("DELETE FROM users WHERE role = 'customer'").run().changes;
if (purged) console.log(`Removed ${purged} legacy customer account(s).`);

console.log('Seed complete.');
