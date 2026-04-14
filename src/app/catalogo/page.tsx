'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Link2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/lib/cart-context';
import { trackPageView } from '@/lib/analytics';
import type { Store, Category, Product } from '@/lib/types';

// Lazy load supabase only in browser
async function getDb() {
  const { getSupabase } = await import('@/lib/supabase');
  return getSupabase();
}

export default function CatalogoPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  // Fetch store, categories, and products
  useEffect(() => {
    async function fetchData() {
      const db = await getDb();
      const d = db as any;
      const { data: storeData, error } = await d
        .from('stores')
        .select('*')
        .eq('slug', 'lumiere-studio')
        .single();

      if (!storeData || error) {
        setLoading(false);
        return;
      }

      setStore(storeData as Store);

      // Track page view
      trackPageView(storeData.id);

      // Fetch categories
      const { data: cats } = await d
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('display_order');

      setCategories((cats || []) as Category[]);

      // Fetch products with categories
      const { data: prods } = await d
        .from('products')
        .select('*, category:categories(*)')
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .order('display_order');

      setProducts((prods || []) as Product[]);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Apply brand theme
  useEffect(() => {
    if (store) {
      document.documentElement.style.setProperty('--color-text-primary', store.primary_color);
      document.documentElement.style.setProperty('--color-accent', store.accent_color);
      document.documentElement.style.setProperty('--color-bg', store.background_color);
    }
  }, [store]);

  if (loading || !store) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  const filteredProducts =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => p.category?.name === activeCategory);

  const allCategories = ['Todos', ...categories.map((c) => c.name)];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header / Hero */}
      <header className="relative">
        <div className="relative h-[45vh] min-h-[300px] max-h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10" />
          {store.banner_url && (
            <img
              src={store.banner_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white"
              >
                {store.logo_url && (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-16 h-16 rounded-xl object-cover mb-4 border-2 border-white/20"
                  />
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-sans)] font-light mb-3">
                  {store.name}
                </h1>
                {store.tagline && (
                  <p className="text-lg md:text-xl text-white/80 font-light mb-4">
                    {store.tagline}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  {store.address && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {store.address}
                    </span>
                  )}
                  {store.hours && (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {store.hours}
                    </span>
                  )}
                  {store.instagram && (
                    <span className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      {store.instagram}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Button (floating) */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[var(--color-text-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <ShoppingBag className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-accent)] text-white text-xs rounded-full flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </button>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {store.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-10 text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {store.description}
          </motion.p>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-10"
          >
            <div className="flex flex-wrap justify-center gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 text-sm rounded-full transition-all ${
                    activeCategory === cat
                      ? 'text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)]'
                  }`}
                  style={
                    activeCategory === cat
                      ? { backgroundColor: 'var(--color-text-primary)' }
                      : {}
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} storeId={store.id} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <p className="text-center text-[var(--color-text-tertiary)] py-12">
            No hay productos en esta categoría.
          </p>
        )}

        {/* WhatsApp CTA (no cart mode fallback) */}
        {itemCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#20bd5a] transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Contactar por WhatsApp
            </a>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--color-border)] py-8 text-center">
        <p className="text-[var(--color-text-tertiary)] text-sm">
          © {new Date().getFullYear()} {store.name} · Catálogo digital
        </p>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
    </div>
  );
}
