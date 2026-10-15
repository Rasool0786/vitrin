
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits } from '../lib/api.js';

function getOrdersList(response) {
  const payload = response?.data ?? response;
  const body = payload?.data ?? payload;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.orders)) return body.orders;

  throw new Error('ساختار پاسخ سفارش‌ها معتبر نیست.');
}

function getProductInfo(item) {
  const variant =
    item?.variant ??
    item?.product_variant ??
    item?.variant_detail ??
    {};

  const product =
    item?.product ??
    item?.product_detail ??
    variant?.product ??
    variant?.product_detail ??
    {};

  const title =
    product?.title ??
    product?.name ??
    variant?.product_title ??
    item?.product_title ??
    'محصول';

  const rawImage =
    product?.main_image ??
    product?.image ??
    product?.image_url ??
    product?.thumbnail ??
    variant?.main_image ??
    variant?.image ??
    item?.product_image ??
    item?.image;

  const imagePath =
    typeof rawImage === 'string' ? rawImage : rawImage?.url;

  let image = imagePath || '';

  if (
    image &&
    !/^(https?:)?\/\//i.test(image) &&
    !image.startsWith('data:')
  ) {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL;

    try {
      if (apiBase) {
        const origin = new URL(
          apiBase,
          window.location.origin
        ).origin;

        image = new URL(image, origin).href;
      }
    } catch {
      // در صورت نامعتبر بودن آدرس پایه، مسیر اصلی حفظ می‌شود.
    }
  }

  const price =
    item?.unit_price ??
    item?.price ??
    product?.final_price ??
    product?.price ??
    variant?.final_price ??
    variant?.price ??
    0;

  return {
    title,
    image,
    price,
    variant,
  };
}

function OrderProductImage({ src, alt }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className="w-12 h-14 shrink-0 rounded-lg bg-stone-100
                   text-stone-400 flex items-center justify-center
                   text-[10px] text-center"
      >
        بدون تصویر
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-12 h-14 shrink-0 object-cover rounded-lg bg-stone-100"
    />
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, userLoading } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError('');

      try {
        const response = await API.orders();
        const list = getOrdersList(response);

        if (!cancelled) {
          setOrders(list);
        }
      } catch (err) {
        console.error(
          'Failed to load orders:',
          err?.response?.status,
          err?.response?.data ?? err
        );

        if (!cancelled) {
          setOrders([]);

          const message =
            err?.response?.data?.detail ??
            err?.response?.data?.message;

          setError(
            typeof message === 'string'
              ? message
              : 'دریافت سفارش‌ها ناموفق بود. اتصال API و لاگ سرور را بررسی کنید.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, navigate]);

  if (userLoading || !user) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8
                       py-8 lg:py-12 min-h-[70vh]">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  return (
    <main
      className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8
                 py-8 lg:py-12 min-h-[70vh]"
    >
      <div className="flex flex-col sm:flex-row sm:items-end
                      sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            سفارش‌های من
          </h1>

          <p className="text-sm text-stone-500 mt-1">
            {toPersianDigits(orders.length)} سفارش ثبت‌شده
          </p>
        </div>

        <Link
          to="/shop"
          className="text-sm text-brand-600 font-medium hover:underline"
        >
          ادامه خرید
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-stone-500 py-8 text-center">
          در حال بارگذاری سفارش‌ها...
        </p>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50
                     text-red-700 p-4 text-sm"
        >
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl
                        border border-stone-200">
          <p className="font-medium mb-2">
            هنوز سفارشی ندارید
          </p>

          <p className="text-sm text-stone-500 mb-6">
            پس از ثبت خرید، سفارش‌های شما اینجا نمایش داده می‌شوند.
          </p>

          <Link
            to="/shop"
            className="inline-flex px-6 py-3 bg-stone-900
                       text-white font-medium rounded-full text-sm"
          >
            رفتن به فروشگاه
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const code =
            order.code ??
            order.order_code ??
            order.id;

          const date =
            order.date ??
            order.created_at ??
            order.createdAt;

          const status =
            order.status_display ??
            order.status ??
            'در حال پردازش';

          const normalizedStatus = String(status).toLowerCase();

          const isDelivered = [
            'تحویل شده',
            'delivered',
            'completed',
          ].includes(normalizedStatus);

          const isCancelled = [
            'لغو شده',
            'لغو شده است',
            'cancelled',
            'canceled',
          ].includes(normalizedStatus);

          const statusColor = isDelivered
            ? 'bg-green-100 text-green-700'
            : isCancelled
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-800';

          const total =
            order.total ??
            order.total_price ??
            order.grand_total ??
            0;

          const rawItems =
            order.items ??
            order.order_items ??
            [];

          const items = Array.isArray(rawItems)
            ? rawItems
            : [];

          return (
            <article
              key={order.id ?? code}
              className="bg-white rounded-2xl border
                         border-stone-200 overflow-hidden"
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center
                           justify-between gap-3 px-5 py-4 border-b
                           border-stone-100 bg-stone-50/80"
              >
                <div>
                  <p className="font-semibold text-sm">
                    کد سفارش: {code ?? 'نامشخص'}
                  </p>

                  <p className="text-xs text-stone-500 mt-0.5">
                    {date
                      ? new Date(date).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1
                                rounded-full ${statusColor}`}
                  >
                    {status}
                  </span>

                  <span className="font-semibold text-sm">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 divide-y divide-stone-100">
                {items.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">
                    جزئیات اقلام در پاسخ API موجود نیست.
                  </p>
                ) : (
                  items.map((item, index) => {
                    const product = getProductInfo(item);

                    return (
                      <div
                        key={item.id ?? `${code}-${index}`}
                        className="flex gap-3 items-center py-2"
                      >
                        <OrderProductImage
                          src={product.image}
                          alt={product.title}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.title}
                          </p>

                          <p className="text-xs text-stone-500">
                            {toPersianDigits(item.quantity ?? 1)}
                            {' عدد · '}
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-3 border-t border-stone-100 text-right">
                <Link
                  to={`/orders/${encodeURIComponent(String(code ?? ''))}`}
                  className="inline-flex text-xs font-medium px-3 py-1.5
                             rounded-full bg-stone-900 text-white
                             hover:opacity-90"
                >
                  جزئیات سفارش
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
