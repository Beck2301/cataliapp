/**
 * Seed script: Inserts demo clothing store data for the test user.
 * 
 * Usage: npx tsx scripts/seed-demo.ts
 * 
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// ─── CONFIG ──────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fikcmluxyljdtvuaizyo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ⚠️  Change this to your test user's email
const TEST_USER_EMAIL = 'demo@cataliapp.com';

// ─── DATA ────────────────────────────────────────────────

const STORE = {
  name: 'URBAN THREADS',
  slug: 'urban-threads',
  tagline: 'Estilo que habla por ti',
  description: 'Moda urbana con actitud. Prendas de calidad para quienes visten con personalidad y buscan lo diferente.',
  primary_color: '#18181B',
  accent_color: '#DC2626',
  background_color: '#FAFAFA',
  font_heading: 'Montserrat',
  font_body: 'Inter',
  mode: 'retail' as const,
  whatsapp: '79082546',
  address: 'Centro Comercial La Gran Vía, Local 42',
  hours: 'Lun - Sáb: 10:00 AM - 8:00 PM',
  instagram: '@bescobar__',
  logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400&h=400',
  banner_url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1400&h=600',
};

const CATEGORIES = [
  { name: 'Camisetas', display_order: 0 },
  { name: 'Jeans', display_order: 1 },
  { name: 'Hoodies', display_order: 2 },
  { name: 'Accesorios', display_order: 3 },
];

const PRODUCTS = [
  // Camisetas
  {
    name: 'Tee Oversized Classic',
    description: 'Camiseta oversized 100% algodón premium. Corte relajado, perfecta para el día a día.',
    price: 24.99,
    compare_at_price: 34.99,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500',
    category_name: 'Camisetas',
    is_featured: true,
    is_available: true,
    display_order: 0,
  },
  {
    name: 'Tee Graphic Streetwear',
    description: 'Diseño exclusivo con estampado frontal. Edición limitada.',
    price: 29.99,
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=500',
    category_name: 'Camisetas',
    is_featured: false,
    is_available: true,
    display_order: 1,
  },
  {
    name: 'Polo Slim Fit',
    description: 'Polo de corte ajustado en algodón piqué. Elegancia casual.',
    price: 32.99,
    image_url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&q=80&w=500',
    category_name: 'Camisetas',
    is_featured: false,
    is_available: true,
    display_order: 2,
  },
  // Jeans
  {
    name: 'Jeans Slim Dark',
    description: 'Denim premium oscuro, corte slim con ligero stretch para mayor comodidad.',
    price: 49.99,
    image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=500',
    category_name: 'Jeans',
    is_featured: true,
    is_available: true,
    display_order: 0,
  },
  {
    name: 'Jeans Cargo Relaxed',
    description: 'Estilo cargo con bolsillos laterales. El fit más cómodo para tu aventura urbana.',
    price: 54.99,
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=500',
    category_name: 'Jeans',
    is_featured: false,
    is_available: true,
    display_order: 1,
  },
  // Hoodies
  {
    name: 'Hoodie Essential Black',
    description: 'La hoodie que no puede faltar. Algodón fleece 380gsm, capucha ajustable.',
    price: 45.99,
    compare_at_price: 59.99,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=500',
    category_name: 'Hoodies',
    is_featured: true,
    is_available: true,
    display_order: 0,
  },
  {
    name: 'Hoodie Vintage Wash',
    description: 'Efecto desgastado vintage. Cada pieza es única.',
    price: 52.99,
    image_url: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&q=80&w=500',
    category_name: 'Hoodies',
    is_featured: false,
    is_available: false, // Agotado
    display_order: 1,
  },
  // Accesorios
  {
    name: 'Gorra Snapback Logo',
    description: 'Gorra estructurada con logo bordado. Ajuste snapback universal.',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1534260164206-2a3a4a72891d?auto=format&fit=crop&q=80&w=500',
    category_name: 'Accesorios',
    is_featured: false,
    is_available: true,
    display_order: 0,
  },
  {
    name: 'Bolso Tote Canvas',
    description: 'Tote bag de lona resistente con estampado minimalista. Ideal para el día a día.',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&q=80&w=500',
    category_name: 'Accesorios',
    is_featured: false,
    is_available: true,
    display_order: 1,
  },
];

// ─── MAIN ────────────────────────────────────────────────

async function seed() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Pass it as an environment variable.');
    console.log('   Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/seed-demo.ts');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔍 Looking for test user...');

  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('❌ Error listing users:', userError.message);
    process.exit(1);
  }

  const testUser = users.find(u => u.email === TEST_USER_EMAIL);
  if (!testUser) {
    console.error(`❌ User with email "${TEST_USER_EMAIL}" not found.`);
    console.log('   Available users:', users.map(u => u.email).join(', '));
    process.exit(1);
  }

  console.log(`✅ Found user: ${testUser.email} (${testUser.id})`);

  // Check if store already exists
  const { data: existingStore } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', testUser.id)
    .maybeSingle();

  if (existingStore) {
    console.log('⚠️  Store already exists for this user. Deleting old data...');
    
    // Delete products first (foreign key)
    await supabase.from('products').delete().eq('store_id', existingStore.id);
    // Delete categories
    await supabase.from('categories').delete().eq('store_id', existingStore.id);
    // Delete store
    await supabase.from('stores').delete().eq('id', existingStore.id);
    
    console.log('🗑️  Old data deleted.');
  }

  // Create store
  console.log('🏪 Creating store...');
  const { data: newStore, error: storeError } = await supabase
    .from('stores')
    .insert({ ...STORE, user_id: testUser.id })
    .select()
    .single();

  if (storeError || !newStore) {
    console.error('❌ Error creating store:', storeError?.message);
    process.exit(1);
  }
  console.log(`✅ Store created: "${newStore.name}" (slug: ${newStore.slug})`);

  // Create categories
  console.log('📦 Creating categories...');
  const { data: newCats, error: catError } = await supabase
    .from('categories')
    .insert(CATEGORIES.map(c => ({ ...c, store_id: newStore.id })))
    .select();

  if (catError || !newCats) {
    console.error('❌ Error creating categories:', catError?.message);
    process.exit(1);
  }
  console.log(`✅ ${newCats.length} categories created`);

  // Create products
  console.log('👕 Creating products...');
  const categoryMap = Object.fromEntries(newCats.map(c => [c.name, c.id]));

  const productsToInsert = PRODUCTS.map(({ category_name, ...p }) => ({
    ...p,
    store_id: newStore.id,
    category_id: categoryMap[category_name] || null,
  }));

  const { data: newProds, error: prodError } = await supabase
    .from('products')
    .insert(productsToInsert)
    .select();

  if (prodError || !newProds) {
    console.error('❌ Error creating products:', prodError?.message);
    process.exit(1);
  }
  console.log(`✅ ${newProds.length} products created`);

  console.log('\n🎉 Seed complete!');
  console.log(`   Dashboard: http://localhost:3000/dashboard`);
  console.log(`   Store:     http://localhost:3000/tienda/${newStore.slug}`);
}

seed().catch(console.error);
