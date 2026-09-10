import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>((set: any) => ({
  cart: [],
  addToCart: (item: CartItem) =>
    set((state: CartStore) => {
      const existingItem = state.cart.find((i: CartItem) => i.id === item.id);
      if (existingItem) {
        return {
          cart: state.cart.map((i: CartItem) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (id: string) =>
    set((state: CartStore) => ({
      cart: state.cart.filter((item: CartItem) => item.id !== id),
    })),
  clearCart: () => set({ cart: [] }),
}));