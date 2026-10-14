import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import {
  formatPrice,
  toPersianDigits,
  isNewProduct,
  productImage,
  discountPercent,
} from '../lib/api.js';

export default function ProductCard({ product }) {
  const { wishlistIds, toggleWishlist, openQuickView } = useApp();

  const isWished = wishlistIds.has(product.id);
  const discount = discountPercent(product);
  const hasDiscount = discount > 0;
  const isNew = isNewProduct(product);
  const finalPrice = product.final_price || product.price;
  const detailUrl = `/product/${encodeURIComponent(product.slug)}`;

  return (
    <article
      className="product-card group bg-white rounded-2xl p-2 sm:p-2.5 border border-stone-100 hover:border-stone-200 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300"
      data-id={product.id}
      data-slug={product.slug}
    >
      <div className="product-image-wrapper relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100">
        <Link to={detailUrl} className="block w-full h-full">
          <img
            src={productImage(product)}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </Link>

        <div className="absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between z-10 pointer-events-none">
          {hasDiscount && (
            <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-sm">
              {toPersianDigits(discount)}٪
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="absolute bottom-2.5 inset-x-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10">
          <Link
            to={detailUrl}
            className="flex-1 py-2 bg-white/95 backdrop-blur text-stone-900 text-[11px] sm:text-xs font-medium rounded-lg shadow text-center hover:bg-white"
          >
            جزئیات
          </Link>
          <button
            type="button"
            className="quick-add-btn flex-1 py-2 bg-stone-900 text-white text-[11px] sm:text-xs font-medium rounded-lg shadow hover:opacity-90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickView(product.slug);
            }}
          >
            سبد
          </button>
        </div>

        <button
          type="button"
          className={
            'wishlist-btn absolute top-2.5 left-2.5 p-1.5 sm:p-2 rounded-full bg-white/90 shadow-md z-10 transition-all duration-300 ' +
            (isWished
              ? 'wishlist-active opacity-100'
              : 'opacity-0 group-hover:opacity-100')
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label="علاقه‌مندی"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill={isWished ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <Link to={detailUrl} className="block pt-3 pb-1.5 px-1">
        <p className="text-[11px] sm:text-xs text-stone-400 mb-0.5">
          {product.category?.name || ''}
        </p>
        <h3 className="font-medium text-sm sm:text-[15px] text-stone-900 leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-sm text-stone-900">
            {formatPrice(finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-stone-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
