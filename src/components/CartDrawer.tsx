'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Send } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import type { Store } from '@/lib/types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  store: Store;
}

export default function CartDrawer({ open, onClose, store }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount, sendWhatsApp } =
    useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--color-surface)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[var(--color-accent)]" />
                <h2 className="text-xl font-[var(--font-sans)]">
                  Tu pedido ({itemCount})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                  <p className="text-[var(--color-text-secondary)]">
                    Tu carrito está vacío
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const unitPrice = item.product.price + item.extraPrice;
                    return (
                      <div
                        key={item.product.id}
                        className="flex gap-3 bg-[var(--color-bg)] rounded-xl p-3"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image_url || ''}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium truncate">
                            {item.product.name}
                          </h4>
                          {Object.entries(item.selectedOptions).map(([key, val]) => (
                            <p key={key} className="text-sm text-[var(--color-text-tertiary)]">
                              {key}: {val}
                            </p>
                          ))}
                          <p className="text-base font-medium text-[var(--color-accent)] mt-1">
                            ${unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-base w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="w-6 h-6 flex items-center justify-center rounded bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-border)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Total</span>
                  <span className="text-2xl font-medium text-[var(--color-accent)]">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => sendWhatsApp(store)}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-xl font-medium hover:bg-[#20bd5a] transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Enviar pedido por WhatsApp
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-base text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors py-1"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
