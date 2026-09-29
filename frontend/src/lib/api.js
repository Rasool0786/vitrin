const API_BASE = '/api';

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);


function getCookie(name) {
  const prefix = `${name}=`;

  const cookie = document.cookie
    .split('; ')
    .find((item) =>
      item.startsWith(prefix)
    );

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(
    cookie.slice(prefix.length)
  );
}


async function ensureCsrfToken() {
  if (getCookie('csrftoken')) {
    return;
  }

  const response = await fetch(
    `${API_BASE}/auth/csrf/`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'دریافت توکن امنیتی ناموفق بود.'
    );
  }
}


async function api(
  path,
  options = {},
) {
  const method = (
    options.method || 'GET'
  ).toUpperCase();

  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfToken();
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };


  const body = options.body;


  if (
    body &&
    !(body instanceof FormData)
  ) {
    headers['Content-Type'] =
      'application/json';
  }


  if (
    !SAFE_METHODS.has(method)
  ) {
    const csrfToken =
      getCookie('csrftoken');

    if (csrfToken) {
      headers['X-CSRFToken'] =
        csrfToken;
    }
  }


  const response = await fetch(
    `${API_BASE}${path}`,
    {
      credentials: 'include',
      ...options,
      headers,
    },
  );


  if (!response.ok) {
    let detail = 'خطایی رخ داد';

    try {
      const data =
        await response.json();

      detail =
        data.detail ||
        JSON.stringify(data);
    } catch {
      // Ignore non-JSON responses.
    }

    const error =
      new Error(detail);

    error.status =
      response.status;

    throw error;
  }


  if (
    response.status === 204
  ) {
    return null;
  }


  return response.json();
}


export const API = {
  /* =====================================================
     Authentication
     ===================================================== */

  csrf: () =>
    api(
      '/auth/csrf/',
    ),

  login: (data) =>
    api(
      '/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  signup: (data) =>
    api(
      '/auth/signup/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  logout: () =>
    api(
      '/auth/logout/',
      {
        method: 'POST',
      },
    ),


  /* =====================================================
     Products
     ===================================================== */

  products: (
    params = {},
  ) => {
    const query =
      new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value != null &&
          value !== ''
        ) {
          query.set(
            key,
            value,
          );
        }
      },
    );

    const qs =
      query.toString();

    return api(
      `/products/${
        qs ? `?${qs}` : ''
      }`,
    );
  },

  product: (slug) =>
    api(
      `/products/${slug}/`,
    ),

  productComments: (
    slug,
    params = {},
  ) => {
    const query =
      new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value != null &&
          value !== ''
        ) {
          query.set(
            key,
            value,
          );
        }
      },
    );

    const qs =
      query.toString();

    return api(
      `/products/${slug}/comments/${
        qs ? `?${qs}` : ''
      }`,
    );
  },

  createProduct: (data) =>
    api(
      '/products/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  updateProduct: (
    slug,
    data,
  ) =>
    api(
      `/products/${slug}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),

  deleteProduct: (slug) =>
    api(
      `/products/${slug}/`,
      {
        method: 'DELETE',
      },
    ),

  categories: () =>
    api(
      '/categories/',
    ),


  /* =====================================================
     Reviews
     ===================================================== */

  createComment: (
    slug,
    data,
  ) =>
    api(
      `/products/${slug}/comments/`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),


  /* =====================================================
     Contact / Newsletter
     ===================================================== */

  sendContact: (data) =>
    api(
      '/contact/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  subscribeNewsletter: (
    email,
  ) =>
    api(
      '/newsletter/',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
        }),
      },
    ),


  /* =====================================================
     Cart
     ===================================================== */

  cart: () =>
    api('/cart/'),

  cartAdd: (
    variant_id,
    quantity = 1,
  ) =>
    api(
      '/cart/items/',
      {
        method: 'POST',
        body: JSON.stringify({
          variant_id,
          quantity,
        }),
      },
    ),

  cartUpdate: (
    variant_id,
    quantity,
  ) =>
    api(
      `/cart/items/${variant_id}/`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          quantity,
        }),
      },
    ),

  cartRemove: (
    variant_id,
  ) =>
    api(
      `/cart/items/${variant_id}/`,
      {
        method: 'DELETE',
      },
    ),

  cartClear: () =>
    api(
      '/cart/clear/',
      {
        method: 'DELETE',
      },
    ),

  cartApplyCoupon: (code) =>
    api(
      '/cart/coupon/',
      {
        method: 'POST',
        body: JSON.stringify({
          code,
        }),
      },
    ),

  cartRemoveCoupon: () =>
    api(
      '/cart/coupon/',
      {
        method: 'DELETE',
      },
    ),

  cartMerge: () =>
    api(
      '/cart/merge/',
      {
        method: 'POST',
      },
    ),


  /* =====================================================
     Wishlist
     ===================================================== */

  wishlist: () =>
    api('/wishlist/'),

  wishlistIds: () =>
    api('/wishlist/ids/'),

  wishlistAdd: (
    product_id,
  ) =>
    api(
      '/wishlist/',
      {
        method: 'POST',
        body: JSON.stringify({
          product_id,
        }),
      },
    ),

  wishlistRemove: (
    productId,
  ) =>
    api(
      `/wishlist/${productId}/`,
      {
        method: 'DELETE',
      },
    ),

  wishlistToggle: (
    product_id,
  ) =>
    api(
      '/wishlist/toggle/',
      {
        method: 'POST',
        body: JSON.stringify({
          product_id,
        }),
      },
    ),

  wishlistMerge: () =>
    api(
      '/wishlist/merge/',
      {
        method: 'POST',
      },
    ),


  /* =====================================================
     User
     ===================================================== */

  me: () =>
    api('/me/'),

  updateProfile: (data) =>
    api(
      '/me/',
      {
        method: 'PATCH',
        body:
          data instanceof FormData
            ? data
            : JSON.stringify(data),
      },
    ),

  changePassword: () =>
    api(
      '/me/password/',
      {
        method: 'POST',
      },
    ),

  deleteAccount: () =>
    api(
      '/me/',
      {
        method: 'DELETE',
      },
    ),


  /* =====================================================
     Orders
     ===================================================== */

  orders: () =>
    api('/orders/'),

  order: (code) =>
    api(
      `/orders/${code}/`,
    ),

  createOrder: (data) =>
    api(
      '/orders/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
};


/* =======================================================
   Utilities
   ======================================================= */

export function formatPrice(price) {
  return (
    new Intl.NumberFormat(
      'fa-IR'
    ).format(price) +
    ' تومان'
  );
}


export function toPersianDigits(num) {
  return String(num).replace(
    /\d/g,
    (digit) =>
      '۰۱۲۳۴۵۶۷۸۹'[digit],
  );
}


export function isNewProduct(product) {
  if (
    !product.datetime_created
  ) {
    return false;
  }

  const created =
    new Date(
      product.datetime_created
    );

  const weekAgo =
    new Date(
      Date.now() -
        7 * 24 * 60 * 60 * 1000
    );

  return created > weekAgo;
}


export function productImage(product) {
  return (
    product.main_image ||
    'https://via.placeholder.com/600x800?text=ویترین'
  );
}


export function discountPercent(product) {
  return product.discount || 0;
}
