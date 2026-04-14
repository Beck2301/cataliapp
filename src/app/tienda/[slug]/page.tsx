'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Link2, Search } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  // Fetch store, categories, and products
  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      if (slug === 'demo-shop') {
        const mockStore = {
          id: 'demo-id',
          name: 'Purrfecto Cat Shop',
          tagline: 'Gatitos con clase para gente con miau',
          description: 'La tienda líder en felinos y accesorios premium para consentir a tu mejor amigo.',
          slug: 'demo-shop',
          primary_color: '#1C1917',
          accent_color: '#B45309',
          background_color: '#FAFAF9',
          font_heading: 'Montserrat',
          font_body: 'Lora',
          mode: 'retail' as const,
          logo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200',
          banner_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200&h=400',
          whatsapp: '79082546',
          address: 'Calle de los Michis 123, Soyapango',
          hours: 'Lun - Dom: 9:00 AM - 8:00 PM',
          instagram: '@purrfecto_shop'
        };

        const mockCategories = [
          { id: 'c1', name: 'Gatitos' },
          { id: 'c2', name: 'Premium' },
          { id: 'c3', name: 'Juguetes' }
        ];

        const mockProducts = [
          { id: 'p1', name: 'Michi Naranja', price: 250, description: 'Tierno y muy juguetón.', image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=400', category_id: 'c1', category: { name: 'Gatitos' } },
          { id: 'p2', name: 'Gatito Gris', price: 320, description: 'Elegancia pura en cuatro patas.', image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400', category_id: 'c1', category: { name: 'Gatitos' } },
          { id: 'p3', name: 'Rascador Tower', price: 85, description: 'Diversión infinita asegurada.', image_url: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=400', category_id: 'c3', category: { name: 'Juguetes' } }
        ];

        setStore(mockStore as any);
        setCategories(mockCategories as any);
        setProducts(mockProducts as any);
        setLoading(false);
        return;
      }
      
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70 z-10" />
          {store.banner_url ? (
            <img
              src={store.banner_url}
              alt={store.name}
              className="w-full h-full object-cover"
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white"
              >
                <div className="flex items-center gap-4 mb-4">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-xl border-2 border-white/20"
                      style={{ backgroundColor: store.primary_color }}
                    >
                      {store.name?.[0] || 'L'}
                    </div>
                  )}
                </div>
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 drop-shadow-md"
                  style={{ fontFamily: headingFont }}
                >
                  {store.name}
                </h1>
                {store.tagline && (
                  <p className="text-lg md:text-xl text-white/90 font-medium mb-4 drop-shadow-sm">
                    {store.tagline}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-white/80 font-medium">
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
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
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
            className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-12 text-lg font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {store.description}
          </motion.p>
        )}

        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-12"
          >
            <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:flex-wrap justify-start sm:justify-center gap-3 no-scrollbar snap-x touch-pan-x w-full">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 whitespace-nowrap snap-start ${
                    activeCategory === cat
                      ? 'text-white scale-105'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:scale-105'
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
