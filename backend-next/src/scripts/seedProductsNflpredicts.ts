import { config } from 'dotenv';
config();

import { getDatabase, disconnectMongo } from '../db/mongo';

const PRODUCTS = [
  // Cigarettes
  {
    id: 1,
    name: 'Benson & Hedges (B&H) Cigarettes',
    price: 440,
    originalPrice: 460,
    costPrice: 360,
    sku: 'CIG-BH-001',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Premium',
    brand: 'Benson & Hedges',
    tags: ['cigarettes', 'premium', 'benson'],
    description: 'Benson & Hedges premium cigarettes. Per stick: ৳23. Per packet (20 sticks): ৳420–৳460.',
    stock: 100,
    status: 'Active',
    rating: 4.5,
    reviews: 80,
    slug: 'benson-hedges-cigarettes',
    variants: [
      { label: 'Per Stick', price: 23 },
      { label: 'Per Packet (20)', price: 440 },
    ],
  },
  {
    id: 2,
    name: 'John Player Gold Leaf Cigarettes',
    price: 340,
    originalPrice: 360,
    costPrice: 280,
    sku: 'CIG-JPGL-002',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Premium',
    brand: 'John Player',
    tags: ['cigarettes', 'gold-leaf', 'jpgl'],
    description: 'John Player Gold Leaf cigarettes. Per stick: ৳18. Per packet (20 sticks): ৳320–৳360.',
    stock: 100,
    status: 'Active',
    rating: 4.3,
    reviews: 65,
    slug: 'john-player-gold-leaf-cigarettes',
    variants: [
      { label: 'Per Stick', price: 18 },
      { label: 'Per Packet (20)', price: 340 },
    ],
  },
  {
    id: 3,
    name: 'Lucky Strike Cigarettes',
    price: 245,
    originalPrice: 250,
    costPrice: 200,
    sku: 'CIG-LS-003',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Mid-Range',
    brand: 'Lucky Strike',
    tags: ['cigarettes', 'lucky-strike'],
    description: 'Lucky Strike cigarettes. Per stick: ৳12–৳13. Per packet (20 sticks): ৳240–৳250.',
    stock: 120,
    status: 'Active',
    rating: 4.2,
    reviews: 55,
    slug: 'lucky-strike-cigarettes',
    variants: [
      { label: 'Per Stick', price: 12 },
      { label: 'Per Packet (20)', price: 245 },
    ],
  },
  {
    id: 4,
    name: 'Marlboro Gold / Advance Cigarettes',
    price: 470,
    originalPrice: 500,
    costPrice: 390,
    sku: 'CIG-MLB-004',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Premium',
    brand: 'Marlboro',
    tags: ['cigarettes', 'marlboro', 'premium'],
    description: 'Marlboro Gold / Advance cigarettes. Per stick: ৳22–৳25. Per packet (20 sticks): ৳440–৳500.',
    stock: 80,
    status: 'Active',
    rating: 4.6,
    reviews: 90,
    slug: 'marlboro-gold-cigarettes',
    variants: [
      { label: 'Per Stick', price: 23 },
      { label: 'Per Packet (20)', price: 470 },
    ],
  },
  {
    id: 5,
    name: 'Camel Blue / Burst Cigarettes',
    price: 192,
    originalPrice: 200,
    costPrice: 155,
    sku: 'CIG-CAM-005',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Mid-Range',
    brand: 'Camel',
    tags: ['cigarettes', 'camel'],
    description: 'Camel Blue / Burst cigarettes. Per stick: ৳10–৳12. Per packet (20 sticks): ৳184–৳200.',
    stock: 100,
    status: 'Active',
    rating: 4.1,
    reviews: 48,
    slug: 'camel-cigarettes',
    variants: [
      { label: 'Per Stick', price: 10 },
      { label: 'Per Packet (20)', price: 192 },
    ],
  },
  {
    id: 6,
    name: 'Star Cigarettes',
    price: 200,
    originalPrice: 200,
    costPrice: 160,
    sku: 'CIG-STAR-006',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Star',
    tags: ['cigarettes', 'star', 'economy'],
    description: 'Star cigarettes. Per stick: ৳10. Per packet (20 sticks): ৳200.',
    stock: 150,
    status: 'Active',
    rating: 3.9,
    reviews: 35,
    slug: 'star-cigarettes',
    variants: [
      { label: 'Per Stick', price: 10 },
      { label: 'Per Packet (20)', price: 200 },
    ],
  },
  {
    id: 7,
    name: 'Derby Cigarettes',
    price: 160,
    originalPrice: 160,
    costPrice: 130,
    sku: 'CIG-DRB-007',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Derby',
    tags: ['cigarettes', 'derby', 'economy'],
    description: 'Derby cigarettes. Per stick: ৳8. Per packet (20 sticks): ৳160.',
    stock: 200,
    status: 'Active',
    rating: 3.8,
    reviews: 30,
    slug: 'derby-cigarettes',
    variants: [
      { label: 'Per Stick', price: 8 },
      { label: 'Per Packet (20)', price: 160 },
    ],
  },
  {
    id: 8,
    name: 'Pilot Cigarettes',
    price: 160,
    originalPrice: 160,
    costPrice: 130,
    sku: 'CIG-PLT-008',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Pilot',
    tags: ['cigarettes', 'pilot', 'economy'],
    description: 'Pilot cigarettes. Per stick: ৳8. Per packet (20 sticks): ৳160.',
    stock: 200,
    status: 'Active',
    rating: 3.8,
    reviews: 28,
    slug: 'pilot-cigarettes',
    variants: [
      { label: 'Per Stick', price: 8 },
      { label: 'Per Packet (20)', price: 160 },
    ],
  },
  {
    id: 9,
    name: 'Hollywood Cigarettes',
    price: 160,
    originalPrice: 160,
    costPrice: 130,
    sku: 'CIG-HLW-009',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Hollywood',
    tags: ['cigarettes', 'hollywood', 'economy'],
    description: 'Hollywood cigarettes. Per stick: ৳8. Per packet (20 sticks): ৳160.',
    stock: 200,
    status: 'Active',
    rating: 3.7,
    reviews: 25,
    slug: 'hollywood-cigarettes',
    variants: [
      { label: 'Per Stick', price: 8 },
      { label: 'Per Packet (20)', price: 160 },
    ],
  },
  {
    id: 10,
    name: 'Royals Cigarettes',
    price: 140,
    originalPrice: 140,
    costPrice: 110,
    sku: 'CIG-ROY-010',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Royals',
    tags: ['cigarettes', 'royals', 'economy'],
    description: 'Royals cigarettes. Per stick: ৳7–৳8. Per packet (20 sticks): ৳140.',
    stock: 200,
    status: 'Active',
    rating: 3.7,
    reviews: 22,
    slug: 'royals-cigarettes',
    variants: [
      { label: 'Per Stick', price: 7 },
      { label: 'Per Packet (20)', price: 140 },
    ],
  },
  {
    id: 11,
    name: 'Navy Cigarettes',
    price: 140,
    originalPrice: 140,
    costPrice: 110,
    sku: 'CIG-NVY-011',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800',
    category: 'Cigarettes',
    subCategory: 'Economy',
    brand: 'Navy',
    tags: ['cigarettes', 'navy', 'economy'],
    description: 'Navy cigarettes. Per stick: ৳7. Per packet (20 sticks): ৳140.',
    stock: 200,
    status: 'Active',
    rating: 3.6,
    reviews: 20,
    slug: 'navy-cigarettes',
    variants: [
      { label: 'Per Stick', price: 7 },
      { label: 'Per Packet (20)', price: 140 },
    ],
  },

  // Snacks & Beverages
  {
    id: 12,
    name: 'পান (Pan / Betel Leaf)',
    price: 10,
    originalPrice: 10,
    costPrice: 6,
    sku: 'SNK-PAN-012',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Traditional',
    brand: 'Local',
    tags: ['pan', 'betel', 'snacks', 'traditional'],
    description: 'Fresh betel leaf (পান), served per piece. Price: ৳10 per khili.',
    stock: 500,
    status: 'Active',
    rating: 4.0,
    reviews: 40,
    slug: 'pan-betel-leaf',
  },
  {
    id: 13,
    name: 'কেক (Cake)',
    price: 10,
    originalPrice: 10,
    costPrice: 7,
    sku: 'SNK-CAKE-013',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Bakery',
    brand: 'Local',
    tags: ['cake', 'snacks', 'bakery'],
    description: 'Freshly baked cake slice, per piece. Price: ৳10 per piece.',
    stock: 300,
    status: 'Active',
    rating: 4.2,
    reviews: 50,
    slug: 'cake-piece',
  },
  {
    id: 14,
    name: 'চা (Cha / Tea)',
    price: 10,
    originalPrice: 10,
    costPrice: 5,
    sku: 'BVG-CHA-014',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Hot Beverages',
    brand: 'Local',
    tags: ['cha', 'tea', 'milk-tea', 'beverages'],
    description: 'Hot tea (milk tea or raw tea) served per cup. Price: ৳10 per cup.',
    stock: 1000,
    status: 'Active',
    rating: 4.5,
    reviews: 120,
    slug: 'cha-tea-cup',
  },
  {
    id: 15,
    name: 'Coca-Cola 250ml',
    price: 40,
    originalPrice: 50,
    costPrice: 28,
    sku: 'BVG-CC-015',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Cold Beverages',
    brand: 'Coca-Cola',
    tags: ['coca-cola', 'cold-drink', 'soda', 'beverages'],
    description: 'Coca-Cola 250ml bottle or can. Price: ৳30–৳50.',
    stock: 200,
    status: 'Active',
    rating: 4.6,
    reviews: 150,
    slug: 'coca-cola-250ml',
  },
  {
    id: 16,
    name: 'Sprite 250ml',
    price: 40,
    originalPrice: 50,
    costPrice: 28,
    sku: 'BVG-SPR-016',
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Cold Beverages',
    brand: 'Sprite',
    tags: ['sprite', 'cold-drink', 'soda', 'beverages'],
    description: 'Sprite 250ml bottle or can. Price: ৳30–৳50.',
    stock: 200,
    status: 'Active',
    rating: 4.5,
    reviews: 130,
    slug: 'sprite-250ml',
  },
  {
    id: 17,
    name: 'Fresh Mineral Water 500ml',
    price: 20,
    originalPrice: 20,
    costPrice: 12,
    sku: 'BVG-FMW-017',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Water',
    brand: 'Fresh',
    tags: ['water', 'mineral-water', 'fresh', 'beverages'],
    description: 'Fresh mineral water 500ml bottle. Price: ৳20.',
    stock: 500,
    status: 'Active',
    rating: 4.4,
    reviews: 100,
    slug: 'fresh-mineral-water-500ml',
  },
  {
    id: 18,
    name: 'Fresh Mineral Water 1.5 Litre',
    price: 37,
    originalPrice: 40,
    costPrice: 25,
    sku: 'BVG-FMW-018',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800',
    category: 'Snacks & Beverages',
    subCategory: 'Water',
    brand: 'Fresh',
    tags: ['water', 'mineral-water', 'fresh', '1.5l', 'beverages'],
    description: 'Fresh mineral water 1.5 litre bottle. Price: ৳35–৳40.',
    stock: 300,
    status: 'Active',
    rating: 4.4,
    reviews: 85,
    slug: 'fresh-mineral-water-1500ml',
  },
];

async function seedProducts() {
  console.log('\n🌱 Starting product seeding for nflpredicts.shopbdit.com...\n');

  const db = await getDatabase();

  try {
    // Find the nflpredicts tenant
    const tenants = await db.collection('entities').find({}).toArray();
    console.log('📋 Available tenants:');
    tenants.forEach((t: any) => {
      console.log(`  - ${t.subdomain || t.name} (ID: ${t._id})`);
    });

    let tenant = tenants.find((t: any) =>
      t.subdomain && t.subdomain.toLowerCase().includes('nflpredicts')
    );

    if (!tenant) {
      // Fallback: look in tenants collection
      const tenantsCol = await db.collection('tenants').find({}).toArray();
      console.log('\n📋 Also checking tenants collection:');
      tenantsCol.forEach((t: any) => {
        console.log(`  - ${t.subdomain || t.name} (ID: ${t._id})`);
      });
      tenant = tenantsCol.find((t: any) =>
        t.subdomain && t.subdomain.toLowerCase().includes('nflpredicts')
      );
    }

    if (!tenant) {
      console.log('\n⚠️  nflpredicts tenant not found.');
      console.log('Create a tenant with subdomain "nflpredicts" first, then re-run this script.\n');
      return;
    }

    const tenantId = tenant._id.toString();
    console.log(`\n✅ Found tenant: ${tenant.subdomain} (ID: ${tenantId})`);

    // Check existing products
    const existing = await db.collection('tenant_data').findOne({
      tenantId,
      key: 'products',
    });

    if (existing?.data?.length) {
      console.log(`\n⚠️  Found ${existing.data.length} existing products. They will be replaced.`);
    }

    const now = new Date().toISOString();
    await db.collection('tenant_data').updateOne(
      { tenantId, key: 'products' },
      {
        $set: { tenantId, key: 'products', data: PRODUCTS, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    console.log(`\n✅ Successfully seeded ${PRODUCTS.length} products!`);
    console.log('\n📊 Product breakdown by category:');
    const counts: Record<string, number> = {};
    PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    Object.entries(counts).forEach(([cat, n]) => console.log(`  - ${cat}: ${n} products`));
    console.log('\n🎉 Done!\n');
  } catch (err) {
    console.error('❌ Error seeding products:', err);
    throw err;
  } finally {
    await disconnectMongo();
  }
}

seedProducts().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
