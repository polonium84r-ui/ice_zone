/**
 * seed.js — Idempotent seed for the Thirst. database.
 * Menu is versioned (MENU_VERSION): bump it to force a full menu refresh on
 * the next run / deploy. Coupons and users are inserted if missing.
 * Run: npm run seed
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

const U = id => `https://images.unsplash.com/photo-${id}?w=600&q=80`;

// Image handles (all verified reachable)
const IMG = {
  hc1: U('1542990253-0d0f5be5f0ed'), hc2: U('1517578239113-b03992dcdd25'), hc3: U('1544787219-7f47ccb76574'),
  wf1: U('1562376552-0d160a2f238d'), wf2: U('1504387432042-8aca549e4729'), wf3: U('1598214886806-c87b84b7078b'),
  br1: U('1606313564200-e75d5e30476c'), br2: U('1607920591413-4ec007e70023'),
  pc1: U('1567620905732-2d1ec7ab7445'), pc2: U('1528207776546-365bb710ee93'),
  ms1: U('1541658016709-82535e94bc69'), boba: U('1558857563-b371033873b8'),
  maggi: U('1585032226651-759b368d7246'), cake: U('1578985545062-69928b1d9587'), protein: U('1594736797933-d0501ba2fe65'),
  mango: U('1571506165871-ee72a35bc9d4'), fruit: U('1525385133512-2f3bdd039054'), orange: U('1497034825429-c343d7c6a68f'),
  straw: U('1541599468348-e96984315921'), berry: U('1498557850523-fd3d118b962e'),
  chocshake: U('1572490122747-3968b75cc699'), rosemilk: U('1571091718767-18b5b1457add'),
  nutella: U('1516559828984-fb3b99548b21'), biscoff: U('1505394033641-40c6ad1178d7')
};

// Bump this when the menu below changes to push it to existing databases.
const MENU_VERSION = 2;

const MENU = [
  // ---- Hot Chocolate (Thirst Special) ----
  { name: 'Classic Hot Chocolate', category: 'Hot Chocolate', description: 'Smooth steamed milk blended with premium hot chocolate powder for a rich, comforting cocoa experience.', price: 49, image: IMG.hc1, rating: 4.7, review_count: 210, is_veg: 1, tags: ['popular'] },
  { name: 'Mallow Crown', category: 'Hot Chocolate', description: 'Soft marshmallows resting like royalty on rich hot chocolate — comfort at its finest.', price: 59, image: IMG.hc2, rating: 4.8, review_count: 175, is_veg: 1, tags: ['popular'] },
  { name: 'Cocoa Kick', category: 'Hot Chocolate', description: 'A bold burst of Milo stirred into silky hot chocolate — fuel for your fire.', price: 69, image: IMG.hc3, rating: 4.7, review_count: 140, is_veg: 1, tags: [] },
  { name: 'Paris Crackle', category: 'Hot Chocolate', description: 'Smooth hot chocolate meets the buttery crunch of French biscuits — a sip of Paris in every sip.', price: 79, image: IMG.hc1, rating: 4.8, review_count: 160, is_veg: 1, tags: [] },
  { name: 'The Signature Sip', category: 'Hot Chocolate', description: 'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll — all in one perfect sip.', price: 99, image: IMG.hc2, rating: 4.9, review_count: 240, is_veg: 1, tags: ['bestseller', 'signature'] },

  // ---- Crushers & Double Shade ----
  { name: 'Mango Crusher', category: 'Crushers', description: 'Cool, refreshing mango crushed over ice.', price: 50, image: IMG.mango, rating: 4.7, review_count: 150, is_veg: 1, tags: ['popular'] },
  { name: 'Litchi Crusher', category: 'Crushers', description: 'Sweet litchi crushed into an icy, refreshing cooler.', price: 50, image: IMG.fruit, rating: 4.6, review_count: 90, is_veg: 1, tags: [] },
  { name: 'Pineapple Crusher', category: 'Crushers', description: 'Tangy-sweet pineapple over crushed ice.', price: 50, image: IMG.orange, rating: 4.5, review_count: 80, is_veg: 1, tags: [] },
  { name: 'Orange Crusher', category: 'Crushers', description: 'Zesty orange crushed cool and refreshing.', price: 50, image: IMG.orange, rating: 4.5, review_count: 85, is_veg: 1, tags: [] },
  { name: 'Strawberry Crusher', category: 'Crushers', description: 'Fresh strawberry crushed into a bright, icy cooler.', price: 50, image: IMG.straw, rating: 4.7, review_count: 130, is_veg: 1, tags: [] },
  { name: 'Blackcurrant Crusher', category: 'Crushers', description: 'Deep blackcurrant crushed cold and refreshing.', price: 50, image: IMG.berry, rating: 4.6, review_count: 95, is_veg: 1, tags: [] },
  { name: 'Kiwi Crusher', category: 'Crushers', description: 'Tangy kiwi crushed over ice — cool and vibrant.', price: 60, image: IMG.fruit, rating: 4.6, review_count: 70, is_veg: 1, tags: [] },
  { name: 'Cindrella', category: 'Crushers', description: 'A dreamy two-tone double-shade cooler.', price: 60, image: IMG.berry, rating: 4.7, review_count: 110, is_veg: 1, tags: ['popular'] },
  { name: 'Strawlitchi', category: 'Crushers', description: 'Strawberry meets litchi in a two-tone double shade.', price: 60, image: IMG.straw, rating: 4.7, review_count: 120, is_veg: 1, tags: ['popular'] },
  { name: 'Fruit Fiesta', category: 'Crushers', description: 'A vibrant medley of fruits in one double-shade glass.', price: 60, image: IMG.fruit, rating: 4.6, review_count: 100, is_veg: 1, tags: [] },

  // ---- Shakes (Thick / Boba / Special / Gym Fuel) ----
  { name: 'Vanilla Frappe Shake', category: 'Shakes', description: 'Classic vanilla blended thick with a cool frappe twist.', price: 99, image: IMG.ms1, rating: 4.7, review_count: 165, is_veg: 1, tags: [] },
  { name: 'Chocolate Fudge Shake', category: 'Shakes', description: 'Thick chocolate blended deep with rich fudge — pure indulgence in every sip.', price: 99, image: IMG.chocshake, rating: 4.8, review_count: 190, is_veg: 1, tags: ['popular'] },
  { name: 'Rosemilk Shake', category: 'Shakes', description: 'Old-school rose with a thick twist — smooth, sweet, and chill.', price: 50, image: IMG.rosemilk, rating: 4.6, review_count: 130, is_veg: 1, tags: [] },
  { name: 'Vanilla Boba Shake', category: 'Shakes', description: 'Creamy vanilla blended thick, with boba in every soft, sweet sip.', price: 119, image: IMG.boba, rating: 4.7, review_count: 145, is_veg: 1, tags: ['popular'] },
  { name: 'Chocolate Boba Shake', category: 'Shakes', description: 'Rich chocolate meets chewy boba — thick, bold, and crave-worthy.', price: 119, image: IMG.boba, rating: 4.8, review_count: 150, is_veg: 1, tags: ['popular'] },
  { name: 'Cold Milo', category: 'Shakes', description: 'Chilled Milo blended thick — cool, malty, and refreshing.', price: 120, image: IMG.ms1, rating: 4.7, review_count: 120, is_veg: 1, tags: [] },
  { name: 'Lotus Biscoff Shake', category: 'Shakes', description: 'A creamy thick shake loaded with Lotus Biscoff.', price: 140, image: IMG.biscoff, rating: 4.9, review_count: 175, is_veg: 1, tags: ['bestseller'] },
  { name: 'Oreo Thickshake', category: 'Shakes', description: 'Thick shake blended with crunchy Oreo cookies.', price: 110, image: IMG.chocshake, rating: 4.7, review_count: 160, is_veg: 1, tags: [] },
  { name: 'Nutella Shake', category: 'Shakes', description: 'Smooth, rich Nutella blended into a thick, dreamy shake.', price: 120, image: IMG.nutella, rating: 4.8, review_count: 170, is_veg: 1, tags: ['popular'] },
  { name: 'Protein Shake', category: 'Shakes', description: 'Blended for your body goals — bulk up or slim down. Available in ₹150 / ₹170.', price: 150, image: IMG.protein, rating: 4.6, review_count: 90, is_veg: 1, tags: ['gym'] },

  // ---- Waffles ----
  { name: 'Belgium Dark Waffle', category: 'Waffles', description: 'Rich dark chocolate over a classic Belgian crisp.', price: 99, image: IMG.wf1, rating: 4.7, review_count: 180, is_veg: 1, tags: ['popular'] },
  { name: 'Belgium White Waffle', category: 'Waffles', description: 'Smooth white chocolate drizzle on golden waffles.', price: 99, image: IMG.wf2, rating: 4.6, review_count: 120, is_veg: 1, tags: [] },
  { name: 'Belgium Milk Waffle', category: 'Waffles', description: 'Creamy milk chocolate melted over a Belgian base.', price: 99, image: IMG.wf3, rating: 4.7, review_count: 140, is_veg: 1, tags: [] },
  { name: 'Nutella Delight Waffle', category: 'Waffles', description: 'Warm waffle layered with Nutella — simple, sweet, divine.', price: 119, image: IMG.wf1, rating: 4.8, review_count: 200, is_veg: 1, tags: ['popular'] },
  { name: 'Strawberry Delight Waffle', category: 'Waffles', description: 'Fresh strawberries and cream on a crisp waffle kiss.', price: 109, image: IMG.wf2, rating: 4.7, review_count: 150, is_veg: 1, tags: [] },
  { name: 'Cookie & Cream Waffle', category: 'Waffles', description: 'Crunchy cookies and cream over a warm waffle.', price: 109, image: IMG.wf3, rating: 4.7, review_count: 160, is_veg: 1, tags: [] },
  { name: 'Cotton Candy Waffle', category: 'Waffles', description: 'Fluffy pink sugar spun into a dreamy dessert ride.', price: 109, image: IMG.wf1, rating: 4.6, review_count: 110, is_veg: 1, tags: [] },
  { name: 'Choco Rocher Waffle', category: 'Waffles', description: 'Hazelnut chocolate, crunchy layers, and luxury in every bite.', price: 119, image: IMG.wf2, rating: 4.8, review_count: 175, is_veg: 1, tags: [] },
  { name: 'Malai Kulfi Waffle', category: 'Waffles', description: 'Desi kulfi meets warm waffle — chilled meets crisp.', price: 119, image: IMG.wf3, rating: 4.7, review_count: 130, is_veg: 1, tags: [] },
  { name: 'Cookie Crunch Waffle', category: 'Waffles', description: 'Crunchy cookie bits loaded on a warm base — fun in every fork.', price: 119, image: IMG.wf1, rating: 4.7, review_count: 140, is_veg: 1, tags: [] },
  { name: 'Double Chocolate Waffle', category: 'Waffles', description: 'Twice the chocolate, double the mood.', price: 129, image: IMG.wf2, rating: 4.8, review_count: 165, is_veg: 1, tags: [] },
  { name: 'Triple Chocolate Waffle', category: 'Waffles', description: 'Dark, milk, and white — all melted into one rich waffle.', price: 139, image: IMG.wf3, rating: 4.8, review_count: 180, is_veg: 1, tags: ['popular'] },
  { name: 'Lotus Biscoff Waffle', category: 'Waffles', description: "Not your average waffle. This one's Biscoff-loaded.", price: 150, image: IMG.wf1, rating: 4.9, review_count: 220, is_veg: 1, tags: ['bestseller', 'must-try'] },

  // ---- Pancakes / Dorayaki ----
  { name: 'Belgium Dark Pancake', category: 'Pancakes', description: 'Dive into deep, bold chocolate that melts your soul with richness.', price: 109, image: IMG.pc1, rating: 4.7, review_count: 130, is_veg: 1, tags: [] },
  { name: 'Belgium White Pancake', category: 'Pancakes', description: 'A silky, sweet embrace that whispers elegance in every bite.', price: 109, image: IMG.pc2, rating: 4.6, review_count: 100, is_veg: 1, tags: [] },
  { name: 'Belgium Milk Pancake', category: 'Pancakes', description: 'Smooth and creamy — the timeless chocolate comfort you always crave.', price: 109, image: IMG.pc1, rating: 4.7, review_count: 110, is_veg: 1, tags: [] },
  { name: 'Cookies & Cream Pancake', category: 'Pancakes', description: 'Crunchy cookies collide with creamy bliss — the perfect dream bite.', price: 119, image: IMG.pc2, rating: 4.7, review_count: 140, is_veg: 1, tags: [] },
  { name: 'Cotton Candy Pancake', category: 'Pancakes', description: 'Fluffy sweetness spun inside — a magical cloud of happiness.', price: 119, image: IMG.pc1, rating: 4.6, review_count: 105, is_veg: 1, tags: [] },
  { name: 'Cookie Crunch Pancake', category: 'Pancakes', description: 'Crunchy surprises in every bite, making your heart smile instantly.', price: 119, image: IMG.pc2, rating: 4.7, review_count: 120, is_veg: 1, tags: [] },
  { name: 'Nutella Pancake', category: 'Pancakes', description: 'Smooth hazelnut and chocolate blend — a creamy, heavenly filling.', price: 129, image: IMG.pc1, rating: 4.8, review_count: 160, is_veg: 1, tags: ['popular'] },
  { name: 'Double Chocolate Pancake', category: 'Pancakes', description: 'Twice the chocolate, endless joy, double the sweetness.', price: 139, image: IMG.pc2, rating: 4.8, review_count: 150, is_veg: 1, tags: [] },
  { name: 'Death by Chocolate Pancake', category: 'Pancakes', description: 'An overdose of chocolate madness — only for fearless chocoholics.', price: 139, image: IMG.pc1, rating: 4.8, review_count: 170, is_veg: 1, tags: ['must-try'] },

  // ---- Brownies & Cakes (Thirst Treats + Kinder Wonder + Dream Cakes) ----
  { name: 'Classic Brownie', category: 'Brownies & Cakes', description: 'Soft, rich, and fudgy — the OG that never fails.', price: 70, image: IMG.br1, rating: 4.7, review_count: 190, is_veg: 1, tags: ['popular'] },
  { name: 'Triple Chocolate Brownie', category: 'Brownies & Cakes', description: 'Dark, milk, and white — three layers of chocolate chaos.', price: 129, image: IMG.br2, rating: 4.8, review_count: 175, is_veg: 1, tags: [] },
  { name: 'London Strawberry', category: 'Brownies & Cakes', description: 'Fresh cream and sweet strawberries, layered with a British twist.', price: 159, image: IMG.cake, rating: 4.7, review_count: 120, is_veg: 1, tags: [] },
  { name: '5 Layer Torte Cake Cup', category: 'Brownies & Cakes', description: 'Five decadent layers stacked in a cup — every spoon, a surprise.', price: 139, image: IMG.cake, rating: 4.8, review_count: 140, is_veg: 1, tags: [] },
  { name: 'Brownie Kebab', category: 'Brownies & Cakes', description: 'Skewered with brownie, marshmallow, and dripping chocolate — dessert, but fun.', price: 139, image: IMG.br1, rating: 4.7, review_count: 130, is_veg: 1, tags: [] },
  { name: 'Hot Choco Brownie', category: 'Brownies & Cakes', description: 'Warm brownie meets creamy hot chocolate — rich, fudgy, and heart-melting. Must try!', price: 139, image: IMG.br2, rating: 4.9, review_count: 210, is_veg: 1, tags: ['must-try', 'bestseller'] },
  { name: 'Kinder JoyBurst Cake', category: 'Brownies & Cakes', description: 'Made for the child in you, crafted for the taste you crave.', price: 180, image: IMG.cake, rating: 4.8, review_count: 160, is_veg: 1, tags: ['premium'] },
  { name: 'Thirst Dream Cake', category: 'Brownies & Cakes', description: 'Our signature dream cake — layered, indulgent, and unforgettable. Must try!', price: 199, image: IMG.cake, rating: 4.9, review_count: 150, is_veg: 1, tags: ['must-try', 'premium'] },

  // ---- Maggi (Scotching Hot) ----
  { name: 'Veg Maggi', category: 'Maggi', description: 'Classic hot veg Maggi — a savoury break from all the sweet.', price: 40, image: IMG.maggi, rating: 4.5, review_count: 90, is_veg: 1, tags: [] },
  { name: 'Cheese Maggi', category: 'Maggi', description: 'Loaded cheesy Maggi — warm, gooey comfort in a bowl.', price: 60, image: IMG.maggi, rating: 4.6, review_count: 110, is_veg: 1, tags: ['popular'] },

  // ---- Combos (Dreamy + Students) ----
  { name: 'Vanilla Thickshake + Belgium Dark Waffle', category: 'Combos', description: 'A dreamy combo — creamy vanilla thickshake with a Belgium dark waffle.', price: 169, image: IMG.chocshake, rating: 4.7, review_count: 95, is_veg: 1, tags: ['combo'] },
  { name: 'Nutella Thickshake + Classic Brownie', category: 'Combos', description: 'Nutella thickshake paired with a warm classic brownie.', price: 159, image: IMG.br1, rating: 4.8, review_count: 110, is_veg: 1, tags: ['combo', 'popular'] },
  { name: 'Biscoff Shake + Belgium White Waffle', category: 'Combos', description: 'Lotus Biscoff shake with a Belgium white waffle.', price: 199, image: IMG.biscoff, rating: 4.8, review_count: 90, is_veg: 1, tags: ['combo'] },
  { name: 'Triple Chocolate Brownie + 15 pcs Pancake', category: 'Combos', description: 'Triple chocolate brownie with 15 pcs pancake (any flavour).', price: 199, image: IMG.br2, rating: 4.8, review_count: 85, is_veg: 1, tags: ['combo'] },
  { name: 'Classic Hot Chocolate + Kinder Joy Cake', category: 'Combos', description: 'Classic hot chocolate paired with a Kinder Joy cake.', price: 189, image: IMG.hc1, rating: 4.7, review_count: 80, is_veg: 1, tags: ['combo'] },
  { name: 'Cold Milo + Double Chocolate Waffle', category: 'Combos', description: 'Cold Milo with a double chocolate waffle.', price: 199, image: IMG.wf2, rating: 4.7, review_count: 88, is_veg: 1, tags: ['combo'] },
  { name: '6 Pcs Pancake + Mini Brownie + Crusher', category: 'Combos', description: 'Students special combo — 6 pcs pancake, mini brownie & a crusher (any flavour).', price: 99, image: IMG.pc1, rating: 4.7, review_count: 130, is_veg: 1, tags: ['combo', 'student'] },
  { name: 'Thick Shake + Mini Waffle', category: 'Combos', description: 'Students special combo — a thick shake with a mini waffle (any flavour).', price: 99, image: IMG.ms1, rating: 4.6, review_count: 120, is_veg: 1, tags: ['combo', 'student'] },
  { name: 'Mini Hot Chocolate + Mini Waffle', category: 'Combos', description: 'Students special combo — mini hot chocolate with a mini waffle (any flavour).', price: 65, image: IMG.hc2, rating: 4.6, review_count: 100, is_veg: 1, tags: ['combo', 'student'] }
];

const COUPONS = [
  { code: 'WELCOME10', type: 'percentage', value: 10, max_discount: 50, min_order: 0, category: null, description: '10% off your first order', active: 1 },
  { code: 'THIRST50', type: 'flat', value: 50, max_discount: null, min_order: 299, category: null, description: '₹50 off on orders above ₹299', active: 1 }
];

// Bootstrap accounts. Passwords/emails come from the environment in production so
// no publicly-known default password is ever shipped. Locally they fall back to
// dev defaults (and a warning is printed). Change the admin password after first login.
const ADMIN_EMAIL = process.env.THIRST_ADMIN_EMAIL || 'admin@thirst.in';
const ADMIN_PASSWORD = process.env.THIRST_ADMIN_PASSWORD || 'ChangeMe@123';
const STAFF_EMAIL = process.env.THIRST_STAFF_EMAIL || 'staff@thirst.in';
const STAFF_PASSWORD = process.env.THIRST_STAFF_PASSWORD || 'ChangeMe@123';

if (!process.env.THIRST_ADMIN_PASSWORD) {
  console.warn('[seed] THIRST_ADMIN_PASSWORD not set — seeding the admin with a default password. Set it in the environment for production and change it after first login.');
}

const USERS = [
  { id: 'admin-001', name: 'Store Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, phone: '', role: 'admin', reward_points: 0 },
  { id: 'staff-001', name: 'Counter Staff', email: STAFF_EMAIL, password: STAFF_PASSWORD, phone: '', role: 'staff', reward_points: 0 }
];

const insertMenu = db.prepare(`INSERT INTO menu_items (name, category, description, price, image, rating, review_count, is_veg, tags, available)
  VALUES (@name, @category, @description, @price, @image, @rating, @review_count, @is_veg, @tags, 1)`);
const insertCoupon = db.prepare(`INSERT INTO coupons (code, type, value, max_discount, min_order, category, description, active)
  VALUES (@code, @type, @value, @max_discount, @min_order, @category, @description, @active)`);
const insertUser = db.prepare(`INSERT INTO users (id, name, email, password_hash, phone, role, reward_points, active, created_by)
  VALUES (@id, @name, @email, @password_hash, @phone, @role, @reward_points, 1, 'system')`);

// ---- Menu (versioned full refresh) ----
const currentMenuVersion = db.pragma('user_version', { simple: true });
if (currentMenuVersion < MENU_VERSION) {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM menu_items').run();
    MENU.forEach(m => insertMenu.run({ ...m, tags: JSON.stringify(m.tags) }));
  });
  tx();
  db.pragma('user_version = ' + MENU_VERSION);
  console.log(`Menu (re)seeded to v${MENU_VERSION}: ${MENU.length} items.`);
} else {
  const c = db.prepare('SELECT COUNT(*) c FROM menu_items').get().c;
  console.log(`Menu already at v${MENU_VERSION} — ${c} items.`);
}

// ---- Coupons: drop the old kunafa-era codes, then insert current ones ----
db.prepare("DELETE FROM coupons WHERE code IN ('SWEET20','FLAT50','KUNAFA10')").run();
for (const c of COUPONS) {
  const exists = db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(c.code);
  if (!exists) { insertCoupon.run(c); console.log(`Seeded coupon ${c.code}.`); }
}

// ---- Users ----
for (const u of USERS) {
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(u.email);
  if (!exists) {
    insertUser.run({ ...u, password_hash: bcrypt.hashSync(u.password, 10) });
    console.log(`Seeded ${u.role} user: ${u.email}`);
  }
}

console.log('Seed complete.');
