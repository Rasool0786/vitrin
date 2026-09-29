import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, toPersianDigits } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Wishlist() {
  const { wishlistIds } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (wishlistIds.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    API.products({ page_size: 200 })
      .then((data) => {
        const all = data.results || data;
        setProducts(all.filter((p) => wishlistIds.has(p.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  const skeleton = (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-stone-200" />
      <div className="pt-3 pb-1.5 px-1 space-y-2">
        <div className="h-3 w-16 bg-stone-200 rounded" />
        <div className="h-4 w-3/4 bg-stone-200 rounded" />
      </div>
    </div>
  );

  return (
    <main className="min-h-[70vh]">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">علاقه‌مندی‌ها</h1>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            حساب کاربری / داشبورد
          </Link>
        </div>
        <p className="text-stone-500 mb-8">
          <span>{toPersianDigits(products.length)}</span> محصول
        </p>

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-lg font-medium text-stone-600 mb-2">لیست علاقه‌مندی‌ها خالی است</p>
            <p className="text-sm text-stone-500 mb-6">محصولاتی که دوست دارید را اینجا ذخیره کنید</p>
            <Link
              to="/shop"
              className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
            >
              مشاهده فروشگاه
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i}>{skeleton}</div>)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </main>
  );
}