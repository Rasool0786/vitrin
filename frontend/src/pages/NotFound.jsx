import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-8xl font-bold text-stone-200 mb-4">۴۰۴</p>
        <h1 className="text-2xl font-bold mb-2">صفحه پیدا نشد</h1>
        <p className="text-stone-500 mb-8 leading-relaxed max-w-md">
          متأسفانه صفحه‌ای که دنبالش بودید وجود ندارد یا جابه‌جا شده است.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex justify-center px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
          >
            صفحه اصلی
          </Link>
          <Link
            to="/shop"
            className="inline-flex justify-center px-6 py-3 border border-stone-300 font-medium rounded-full hover:bg-stone-100 transition-colors"
          >
            فروشگاه
          </Link>
        </div>
      </div>
    </>
  );
}