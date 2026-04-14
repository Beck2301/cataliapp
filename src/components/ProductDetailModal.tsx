'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/types';

interface ProductDetailModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  open,
  onClose,
}: ProductDetailModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const extraPrice = product.variants?.reduce((sum, variant) => {
    const selectedOpt = selectedOptions[variant.name];
    const opt = variant.options.find((o) => o.name === selectedOpt);
    return sum + (opt?.price_modifier || 0);
  }, 0) || 0;

  const totalPrice = (product.price + extraPrice) * quantity;

  const handleAdd = () => {
    addItem(product, quantity, selectedOptions);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  const handleOptionSelect = (variantName: string, optionName: string) => {
    setSelectedOptions((prev) => ({ ...prev, [variantName]: optionName }));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-[var(--color-surface)] rounded-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto flex-1">
              {/* Image */}
              <div className="aspect-square md:aspect-[16/9] relative bg-[var(--color-surface-elevated)]">
                <img
                  src={product.image_url || ''}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <div>
                  {product.category && (
                    <span className="text-sm uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      {product.category.name}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-4xl font-[var(--font-sans)] mt-2">
                    {product.name}
                  </h2>
                  {product.description && (
                    <p className="text-base text-[var(--color-text-secondary)] mt-3 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Variants */}
                {product.variants?.map((variant) => (
                  <div key={variant.id}>
                    <label className="block text-base font-medium mb-3">
                      {variant.name}
                      {variant.required && (
                        <span className="text-[var(--color-error)] ml-1">*</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => {
                        const isSelected = selectedOptions[variant.name] === option.name;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleOptionSelect(variant.name, option.name)}
                            className={`px-4 py-2.5 rounded-lg text-base border transition-all ${
                              isSelected
                                ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                                : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                            }`}
                          >
                            {option.name}
                            {option.price_modifier > 0 && (
                              <span className="ml-1 opacity-60">
                                +${option.price_modifier.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Price & Quantity */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <div>
                    <p className="text-3xl font-medium" style={{ color: 'var(--color-accent)' }}>
                      ${totalPrice.toFixed(2)}
                    </p>
                    {extraPrice > 0 && (
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        ${product.price.toFixed(2)} + ${extraPrice.toFixed(2)} extras
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-elevated)] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-elevated)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="p-5 border-t border-[var(--color-border)]">
              <button
                onClick={handleAdd}
                disabled={added}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all ${
                  added
                    ? 'bg-[var(--color-success)] text-white'
                    : 'bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90'
                }`}
              >
                {added ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Agregado!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al pedido
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
