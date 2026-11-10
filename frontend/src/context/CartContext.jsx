import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBranch } from './BranchContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { selectedBranch } = useBranch();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('income_cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('income_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add to cart with single branch check
  const addToCart = (product, selectedOptions = [], quantity = 1, notes = '') => {
    // Check branch consistency
    if (cartItems.length > 0 && selectedBranch) {
      const firstBranchId = cartItems[0].branchId;
      if (firstBranchId && firstBranchId !== selectedBranch.id) {
        const confirmSwitch = window.confirm(
          `Keranjang Anda berisi produk dari cabang lain. Kosongkan keranjang dan mulai memesan dari ${selectedBranch.name}?`
        );
        if (!confirmSwitch) return false;
        setCartItems([]);
      }
    }

    // Calculate unit price with options
    let unitPrice = Number(product.price || product.base_price || 0);
    const optionsSnapshots = [];

    for (const opt of selectedOptions) {
      unitPrice += Number(opt.price_adjustment || 0);
      optionsSnapshots.push({
        option_id: opt.id,
        group_name_snapshot: opt.group_name || 'Option',
        option_name_snapshot: opt.name,
        price_adjustment: Number(opt.price_adjustment || 0),
      });
    }

    const subtotal = unitPrice * quantity;

    const newItem = {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      branchId: selectedBranch ? selectedBranch.id : 1,
      unitPrice,
      quantity,
      subtotal,
      notes,
      options: optionsSnapshots,
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCartItems((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('income_cart_items');
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalAmount,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

