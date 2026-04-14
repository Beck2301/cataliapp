-- =============================================
-- CATALOGO DIGITAL - Supabase Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STORES (Tiendas)
-- =============================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,           -- URL amigable: catalogue-digital.com/tienda/slug
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  address TEXT,
  hours TEXT,
  instagram TEXT,
  whatsapp TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,

  -- Brand theming
  primary_color TEXT DEFAULT '#1C1917',
  accent_color TEXT DEFAULT '#B45309',
  background_color TEXT DEFAULT '#FAFAF9',
  font_heading TEXT DEFAULT 'serif',    -- serif | sans
  font_body TEXT DEFAULT 'sans',

  -- Mode: retail | restaurant
  mode TEXT DEFAULT 'retail' CHECK (mode IN ('retail', 'restaurant')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),       -- Precio tachado (para ofertas)
  image_url TEXT,
  images TEXT[],                        -- Array de URLs adicionales
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT VARIANTS (for restaurant mode)
-- =============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g. "Tamaño", "Extras"
  display_order INT DEFAULT 0,
  required BOOLEAN DEFAULT FALSE,
  multiple BOOLEAN DEFAULT FALSE,        -- Puede seleccionar varios
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT VARIANT OPTIONS
-- =============================================
CREATE TABLE product_variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g. "Chico", "Mediano", "Grande"
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Precio adicional
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANALYTICS - PAGE VIEWS
-- =============================================
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,              -- Anonymous session tracking
  path TEXT DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANALYTICS - PRODUCT VIEWS
-- =============================================
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANALYTICS - WHATSAPP CLICKS (conversiones)
-- =============================================
CREATE TABLE whatsapp_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_ids UUID[],                    -- Productos en el carrito
  total_amount DECIMAL(10,2),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(store_id) WHERE is_featured = true;
CREATE INDEX idx_products_available ON products(store_id) WHERE is_available = true;
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_variant_options_variant ON product_variant_options(variant_id);
CREATE INDEX idx_page_views_store ON page_views(store_id);
CREATE INDEX idx_page_views_created ON page_views(created_at);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_whatsapp_clicks_store ON whatsapp_clicks(store_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS (Row Level Security) Policies
-- =============================================

-- Stores: anyone can read and update (no auth needed for now)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Anyone can update stores" ON stores FOR UPDATE USING (true);

-- Categories: anyone can read by store
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Products: anyone can view available ones
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Analytics: insert only, no read (public)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT WITH CHECK (true);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert product views" ON product_views FOR INSERT WITH CHECK (true);

ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert whatsapp clicks" ON whatsapp_clicks FOR INSERT WITH CHECK (true);

-- =============================================
-- SEED DATA (Demo)
-- =============================================

INSERT INTO stores (slug, name, tagline, description, address, hours, instagram, whatsapp, banner_url, accent_color, mode)
VALUES (
  'lumiere-studio',
  'Lumière Studio',
  'Piezas únicas con alma artesanal',
  'Descubre nuestra colección de piezas hechas a mano con materiales premium.',
  'Ciudad de México, CDMX',
  'Lun - Sáb: 10am - 7pm',
  '@lumiere.studio',
  '5215512345678',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=600&fit=crop',
  '#B45309',
  'retail'
);

INSERT INTO categories (store_id, name, display_order)
SELECT
  (SELECT id FROM stores WHERE slug = 'lumiere-studio'),
  unnest(ARRAY['Joyería', 'Cerámica', 'Textiles', 'Hogar']),
  unnest(ARRAY[1, 2, 3, 4]);

INSERT INTO products (store_id, category_id, name, description, price, image_url, is_featured, is_available, display_order)
SELECT
  (SELECT id FROM stores WHERE slug = 'lumiere-studio'),
  (SELECT id FROM categories WHERE name = cat_name LIMIT 1),
  prod_name,
  prod_desc,
  prod_price,
  prod_image,
  prod_featured,
  true,
  prod_order
FROM (VALUES
  ('Joyería', 'Aretes Luna Dorada', 'Aretes artesanales en oro laminado con piedras naturales', 850, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop', true, 1),
  ('Cerámica', 'Taza Artesanal Terra', 'Cerámica hecha a mano con esmalte orgánico', 420, 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=600&h=750&fit=crop', false, 2),
  ('Textiles', 'Bufanda Alpaca Natural', 'Tejida a mano con fibra de alpaca peruana', 1200, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=750&fit=crop', true, 3),
  ('Joyería', 'Collar Minimalista', 'Cadena de plata esterlina con dije geométrico', 680, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=750&fit=crop', false, 4),
  ('Hogar', 'Set Vajilla Rustica', '4 piezas de cerámica con acabado mate', 2400, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=750&fit=crop', true, 5),
  ('Textiles', 'Bolso Macramé', 'Tejido a mano con algodón orgánico', 950, 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=750&fit=crop', false, 6)
) AS t(cat_name, prod_name, prod_desc, prod_price, prod_image, prod_featured, prod_order);
