import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { API } from '../lib/api.js';


const AppContext =
  createContext(null);


export function AppProvider({
  children,
}) {
  const [toasts, setToasts] =
    useState([]);

  const [user, setUser] =
    useState(null);

  const [userLoading, setUserLoading] =
    useState(true);


  const [cart, setCart] =
    useState({
      items: [],
      subtotal: 0,
      discount_amount: 0,
      total: 0,
      coupon: null,
    });


  const [wishlistIds, setWishlistIds] =
    useState(new Set());


  const [quickViewSlug, setQuickViewSlug] =
    useState(null);


  /* =====================================================
     Toast
     ===================================================== */

  const showToast = (
    message,
    type = 'success',
  ) => {
    const id =
      Date.now() +
      Math.random();

    setToasts(
      (current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ],
    );

    setTimeout(() => {
      setToasts(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id,
          ),
      );
    }, 3500);
  };


  const removeToast = (id) => {
    setToasts(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id,
        ),
    );
  };


  /* =====================================================
     User
     ===================================================== */

  const refreshUser = async () => {
    setUserLoading(true);

    try {
      const data =
        await API.me();

      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  };


  const logout = async () => {
    try {
      await API.logout();
    } catch {
      // Clear frontend state regardless.
    }

    setUser(null);
  };


  /* =====================================================
     Cart
     ===================================================== */

  const refreshCart =
    async () => {
      try {
        const data =
          await API.cart();

        setCart(data);
      } catch {
        // Anonymous cart may fail silently.
      }
    };


  const addToCart = async (
    variantId,
    quantity = 1,
  ) => {
    try {
      const data =
        await API.cartAdd(
          variantId,
          quantity,
        );

      setCart(data);

      showToast(
        'محصول با موفقیت به سبد خرید اضافه شد.',
      );

      return true;
    } catch (error) {
      showToast(
        error.message ||
          'خطا در افزودن به سبد',
        'error',
      );

      return false;
    }
  };


  const updateCartItem = async (
    variantId,
    quantity,
  ) => {
    try {
      const data =
        await API.cartUpdate(
          variantId,
          quantity,
        );

      setCart(data);
    } catch (error) {
      showToast(
        error.message,
        'error',
      );
    }
  };


  const removeCartItem = async (
    variantId,
  ) => {
    try {
      const data =
        await API.cartRemove(
          variantId,
        );

      setCart(data);

      showToast(
        'محصول از سبد حذف شد.',
      );
    } catch (error) {
      showToast(
        error.message,
        'error',
      );
    }
  };


  const clearCart =
    async () => {
      try {
        const data =
          await API.cartClear();

        setCart(data);
      } catch (error) {
        showToast(
          error.message,
          'error',
        );
      }
    };


  /* =====================================================
     Wishlist
     ===================================================== */

  const refreshWishlist =
    async () => {
      try {
        const data =
          await API.wishlistIds();

        setWishlistIds(
          new Set(
            data.product_ids || [],
          ),
        );
      } catch {
        setWishlistIds(
          new Set(),
        );
      }
    };


  const toggleWishlist =
    async (productId) => {
      const was =
        wishlistIds.has(
          productId,
        );


      setWishlistIds(
        (previous) => {
          const next =
            new Set(previous);

          if (was) {
            next.delete(
              productId,
            );
          } else {
            next.add(
              productId,
            );
          }

          return next;
        },
      );


      try {
        const response =
          await API.wishlistToggle(
            productId,
          );

        showToast(
          response.status ===
            'added'
            ? 'به علاقه‌مندی‌ها اضافه شد.'
            : 'از علاقه‌مندی‌ها حذف شد.',
        );
      } catch (error) {
        setWishlistIds(
          (previous) => {
            const next =
              new Set(
                previous
              );

            if (was) {
              next.add(
                productId
              );
            } else {
              next.delete(
                productId
              );
            }

            return next;
          },
        );

        showToast(
          error.message ||
            'خطا در انجام عملیات.',
          'error',
        );
      }
    };


  /* =====================================================
     Quick View
     ===================================================== */

  const openQuickView =
    (slug) => {
      setQuickViewSlug(
        slug
      );
    };


  const closeQuickView =
    () => {
      setQuickViewSlug(
        null
      );
    };


  /* =====================================================
     Initial load
     ===================================================== */

  useEffect(() => {
    refreshUser();
    refreshCart();
    refreshWishlist();
  }, []);


  const value = {
    toasts,
    showToast,
    removeToast,

    user,
    userLoading,
    refreshUser,
    logout,
    setUser,

    cart,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,

    wishlistIds,
    refreshWishlist,
    toggleWishlist,

    quickViewSlug,
    openQuickView,
    closeQuickView,
  };


  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used inside <AppProvider>',
    );
  }

  return context;
}
