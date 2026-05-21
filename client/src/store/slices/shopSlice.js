import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("wishlist") || "[]")
};

const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const idx = state.cart.findIndex((i) => i.productId === action.payload.productId);
      if (idx >= 0) state.cart[idx].quantity += action.payload.quantity || 1;
      else state.cart.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      localStorage.setItem("cart", JSON.stringify(state.cart));
    },
    updateCartQty: (state, action) => {
      state.cart = state.cart.map((item) =>
        item.productId === action.payload.productId ? { ...item, quantity: Math.max(1, action.payload.quantity) } : item
      );
      localStorage.setItem("cart", JSON.stringify(state.cart));
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((i) => i.productId !== action.payload);
      localStorage.setItem("cart", JSON.stringify(state.cart));
    },
    toggleWishlist: (state, action) => {
      state.wishlist = state.wishlist.includes(action.payload)
        ? state.wishlist.filter((id) => id !== action.payload)
        : [...state.wishlist, action.payload];
      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
    },
    clearCart: (state) => {
      state.cart = [];
      localStorage.setItem("cart", "[]");
    }
  }
});

export const { addToCart, updateCartQty, removeFromCart, toggleWishlist, clearCart } = shopSlice.actions;
export default shopSlice.reducer;
