'use client';

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { CartItem, Product, Store } from '@/lib/types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product.id === action.payload.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.payload.product.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.product.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        items: state.items.map((i) =>
          i.product.id === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
};

const CartContext = createContext<{
  items: CartItem[];
  addItem: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  sendWhatsApp: (store: Store) => void;
}>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
  sendWhatsApp: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const loadCart = (): CartState => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return { items: parsed };
        }
      }
    } catch {
      // ignore parse errors
    }
    return { items: [] };
  };

  const [state, dispatch] = useReducer(cartReducer, { items: [] }, loadCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = useCallback(
    (product: Product, quantity = 1, options: Record<string, string> = {}) => {
      const extraPrice = product.variants?.reduce((sum, v) => {
        const selectedOpt = options[v.name];
        const opt = v.options.find((o) => o.name === selectedOpt);
        return sum + (opt?.price_modifier || 0);
      }, 0) || 0;

      dispatch({
        type: 'ADD_ITEM',
        payload: { product, quantity, selectedOptions: options, extraPrice },
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    }
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const total = state.items.reduce(
    (sum, item) => sum + (item.product.price + item.extraPrice) * item.quantity,
    0
  );

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const sendWhatsApp = useCallback(async (store: Store) => {
    if (state.items.length === 0) return;

    const lineItems = state.items
      .map((item) => {
        const optionsStr = Object.entries(item.selectedOptions)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n');
        const unitPrice = item.product.price + item.extraPrice;
        const subtotal = unitPrice * item.quantity;
        return `${item.quantity}x ${item.product.name}${optionsStr ? '\n' + optionsStr : ''}\n  $${unitPrice.toFixed(2)} c/u = $${subtotal.toFixed(2)}`;
      })
      .join('\n\n');

    const message = `¡Hola! ${store.name} 🛍️\n\nMe interesa hacer un pedido:\n\n${lineItems}\n\n💰 Total: $${total.toFixed(2)}\n\n¿Podemos coordinar la entrega?`;

    // Track conversion (lazy load supabase)
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const db = getSupabase() as any;
      await db
        .from('whatsapp_clicks')
        .insert({
          store_id: store.id,
          product_ids: state.items.map((i) => i.product.id),
          total_amount: total,
          session_id: crypto.randomUUID(),
        });
    } catch {
      // fail silently
    }

    window.open(
      `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`,
      '_blank'
    );

    clearCart();
  }, [state.items, total, clearCart]);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        sendWhatsApp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
