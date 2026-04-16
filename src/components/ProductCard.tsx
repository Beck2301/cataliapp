'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { trackProductView } from '@/lib/analytics';
import type { Product } from '@/lib/types';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardProps {
  product: Product;
  index: number;
  storeId: string;
  hasWhatsapp?: boolean;
}

export default function ProductCard({ product, index, storeId, hasWhatsapp = true }: ProductCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleOpenDetail = () => {
    setShowDetail(true);
    trackProductView(storeId, product.id);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group cursor-pointer"
        onClick={handleOpenDetail}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-elevated)] transition-colors">
          <img
            src={product.image_url || ''}
            alt={product.name}
            className={`w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 ${
              product.is_available === false ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />

          {/* Top Left Badges (Stacked) */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 items-start z-10 w-[calc(100%-16px)]">
            {product.category && (
              <span className="px-2 text-[9px] sm:text-xs py-0.5 sm:py-1 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-widest font-bold shadow-sm max-w-full truncate">
                {product.category.name}
              </span>
            )}
            {product.is_available !== false && product.compare_at_price && product.compare_at_price > product.price && (
              <span className="px-2 text-[9px] sm:text-xs py-0.5 sm:py-1 bg-[var(--color-error)] text-white uppercase tracking-widest font-bold shadow-sm max-w-full truncate">
                Oferta
              </span>
            )}
          </div>

          {/* Availability/Sale Badge in Center */}
          {product.is_available === false && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs uppercase tracking-[0.2em] font-bold border border-white/20 whitespace-nowrap z-10 rotate-[-5deg]">
              Agotado
            </span>
          )}

          {/* Quick Add Button */}
          {hasWhatsapp && product.is_available !== false && (
            <button
              onClick={handleQuickAdd}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                added
                  ? 'bg-[var(--color-success)] text-white scale-110'
                  : 'bg-[var(--color-text-primary)] text-[var(--color-bg)] opacity-100 sm:opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg'
              }`}
            >
              {added ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-3 space-y-1.5">
          <h3 className="font-[var(--font-sans)] text-sm sm:text-lg text-[var(--color-text-primary)] leading-snug">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-[10px] sm:text-sm leading-tight text-[var(--color-text-primary)] font-light opacity-90 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <p className="text-sm sm:text-lg font-medium" style={{ color: 'var(--color-accent)' }}>
              ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-[11px] sm:text-sm text-[var(--color-text-tertiary)] line-through">
                ${product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </motion.article>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={product}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        hasWhatsapp={hasWhatsapp}
      />
    </>
  );
}
