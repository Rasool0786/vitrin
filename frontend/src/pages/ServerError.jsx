import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-8xl font-bold text-stone-200 mb-4">۵۰۰</p>
      <h1 className="text-2xl font-bold mb-2">خطای سرور</h1>
      <p className="text-stone-500 mb-8 leading-relaxed max-w-md">
        مشکلی در سمت سرور پیش آمده است. لطفاً چند لحظه دیگر دوباره تلاش کنید.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex justify-center px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
        >
          تلاش مجدد
        </button>
        <Link
          to="/"
          className="inline-flex justify-center px-6 py-3 border border-stone-300 font-medium rounded-full hover:bg-stone-100 transition-colors"
        >
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
}