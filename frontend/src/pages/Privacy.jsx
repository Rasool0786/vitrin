import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-3">حریم خصوصی</h1>
          <p className="text-stone-500">سیاست حفظ اطلاعات شخصی کاربران ویترین</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-8 text-sm text-stone-600 leading-relaxed">
          <p className="text-base">
            ویترین متعهد است از اطلاعات شخصی شما محافظت کند و فقط در چارچوب ارائه خدمات فروشگاه از آن‌ها استفاده کند.
          </p>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۱. اطلاعاتی که جمع‌آوری می‌کنیم</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>نام، ایمیل، شماره تماس و آدرس ارسال</li>
              <li>سوابق سفارش و ارتباط با پشتیبانی</li>
              <li>اطلاعات فنی محدود مرورگر برای امنیت</li>
            </ul>
            <p className="mt-2">اطلاعات کارت بانکی روی سرورهای ما ذخیره نمی‌شود.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۲. نحوه استفاده</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>پردازش و ارسال سفارش</li>
              <li>پاسخ به پشتیبانی</li>
              <li>خبرنامه در صورت رضایت شما</li>
              <li>بهبود امنیت</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۳. اشتراک‌گذاری</h2>
            <p>اطلاعات را برای تبلیغات نمی‌فروشیم. فقط در حد ضرورت با حمل‌ونقل، درگاه پرداخت یا الزام قانونی ممکن است به اشتراک گذاشته شود.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۴. کوکی و localStorage</h2>
            <p>برای سبد و علاقه‌مندی از ذخیره‌سازی محلی مرورگر استفاده می‌شود.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۵. حقوق شما</h2>
            <p>
              می‌توانید اصلاح یا حذف اطلاعات را از{' '}
              <Link to="/contact" className="text-brand-600 hover:underline">تماس با ما</Link>{' '}
              یا داشبورد درخواست کنید.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-2">۶. امنیت و تغییرات</h2>
            <p>از روش‌های متعارف امنیتی استفاده می‌کنیم. در صورت به‌روزرسانی این صفحه، تاریخ زیر تغییر می‌کند.</p>
          </div>

          <p className="text-xs text-stone-400 pt-4 border-t border-stone-200">
            آخرین به‌روزرسانی: فروردین ۱۴۰۵ · info@vitrin.ir
          </p>
        </div>
      </section>
    </main>
  );
}