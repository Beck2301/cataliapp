'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Search, Check, Filter, ChevronDown } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/lib/cart-context';
import { trackPageView } from '@/lib/analytics';
import type { Store, Category, Product } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';

export default function TiendaPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  // Fetch store, categories, and products
  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      
      const db = createClient();
      const { data: storeData, error } = await db
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!storeData || error) {
        setLoading(false);
        return;
      }

      setStore(storeData as Store);
      trackPageView(storeData.id);

      // Fetch categories
      const { data: cats } = await db
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('display_order');

      setCategories((cats || []) as Category[]);

      // Fetch products
      const { data: prods } = await db
        .from('products')
        .select('*, category:categories(*)')
        .eq('store_id', storeData.id)
        .order('display_order');

      setProducts((prods || []) as Product[]);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  // Apply brand theme
  useEffect(() => {
    if (store) {
      document.documentElement.style.setProperty('--color-text-primary', store.primary_color || '#1C1917');
      document.documentElement.style.setProperty('--color-accent', store.accent_color || '#B45309');
      document.documentElement.style.setProperty('--color-bg', store.background_color || '#FAFAF9');
    }
  }, [store]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Search className="w-16 h-16 text-neutral-300 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800">Tienda no encontrada</h1>
        <p className="text-neutral-500 mt-2">La tienda que buscas no existe o ha sido eliminada.</p>
      </div>
    );
  }

  const filteredProducts =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => p.category?.name === activeCategory);

  const allCategories = ['Todos', ...categories.map((c) => c.name)];

  const headingFont = store.font_heading === 'sans' || !store.font_heading ? 'Montserrat' : store.font_heading;
  const bodyFont = store.font_body === 'sans' || !store.font_body ? 'Lora' : store.font_body;

  return (
    <div 
      className="min-h-screen bg-[var(--color-bg)] transition-colors duration-500"
      style={{ fontFamily: bodyFont }}
    >
      {/* Inject Google Fonts dynamically more reliably */}
      <link 
        rel="stylesheet" 
        href={`https://fonts.googleapis.com/css2?family=${headingFont.replace(' ', '+')}:wght@700&family=${bodyFont.replace(' ', '+')}:wght@400;500;600&display=swap`} 
      />
      <header className="relative">
        <div className="relative h-[45vh] min-h-[300px] max-h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/90 z-10" />
          {store.banner_url ? (
            <img
              src={store.banner_url}
              alt={store.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div 
              className="w-full h-full relative" 
              style={{ background: `linear-gradient(135deg, ${store.primary_color} 0%, ${store.accent_color} 100%)` }}
            >
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white"
              >
                <div className="flex items-center gap-4 mb-3">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl border-2 border-white/30"
                      style={{ backgroundColor: store.primary_color }}
                    >
                      {store.name?.[0] || 'L'}
                    </div>
                  )}
                  <div>
                    <h1 
                      className="text-2xl sm:text-3xl md:text-5xl font-black drop-shadow-xl"
                      style={{ fontFamily: headingFont }}
                    >
                      {store.name}
                    </h1>
                    {store.tagline && (
                      <p className="text-sm md:text-lg text-white/80 font-medium drop-shadow-md mt-1">
                        {store.tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-white/80">
                  {store.address && (
                    <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <MapPin className="w-3 h-3" />
                      {store.address}
                    </span>
                  )}
                  {store.hours && (
                    <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <Clock className="w-3 h-3" />
                      {store.hours}
                    </span>
                  )}
                  {store.instagram && (
                    <a 
                      href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                      <InstagramIcon className="w-3 h-3" />
                      {store.instagram}
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[var(--color-text-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-[var(--color-accent)]/50"
      >
        <ShoppingBag className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-accent)] text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
            {itemCount}
          </span>
        )}
      </button>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {store.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-8 md:mb-12 text-sm md:text-lg font-medium px-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {store.description}
          </motion.p>
        )}

        {categories.length > 0 && (
          <div className="flex justify-center mb-10 px-4 sm:px-0">
            <div className="relative w-full max-w-xs">
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full flex items-center justify-between px-5 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)] transition-colors"
              >
                <span className="tracking-wide">{activeCategory}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCategoryOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-30"
                      onClick={() => setIsCategoryOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 z-40 mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden"
                    >
                      {allCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors ${
                            activeCategory === cat
                              ? 'bg-[var(--color-surface-elevated)] font-semibold text-[var(--color-text-primary)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${activeCategory === cat ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: 'var(--color-accent)' }} />
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-14"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} storeId={store.id} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[var(--color-text-tertiary)] py-20 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] mt-8">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-[var(--color-border-subtle)]" />
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No hay productos</h3>
            <p>No se encontraron productos en esta categoría.</p>
          </motion.div>
        )}

        {itemCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20 text-center"
          >
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-[#25D366]/20 hover:bg-[#20bd5a] hover:-translate-y-1 transition-all"
            >
              <ShoppingBag className="w-6 h-6" />
              Contactar por WhatsApp
            </a>
          </motion.div>
        )}
      </main>

      <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-[var(--color-text-tertiary)]">
        <p className="font-medium">
          © {new Date().getFullYear()} {store.name}
        </p>
        <p className="text-sm mt-2">Catálogo digital impulsado por CatalogoApp</p>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
    </div>
  );
}
