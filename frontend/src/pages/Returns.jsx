import { Link } from 'react-router-dom';

export default function Returns() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">شرایط بازگشت کالا</h1>
          <p className="text-stone-500">قوانین شفاف برای آرامش خاطر شما</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 text-stone-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-3">مهلت بازگشت</h2>
            <p>تا <strong>۷ روز</strong> پس از دریافت مرسوله می‌توانید درخواست بازگشت ثبت کنید.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-3">شرایط پذیرش</h2>
            <ul className="list-disc list-inside space-y-2 mr-2">
              <li>کالا استفاده نشده و بدون آسیب باشد</li>
              <li>برچسب‌ها و بسته‌بندی اصلی حفظ شده باشد</li>
              <li>فاکتور یا کد سفارش همراه باشد</li>
              <li>کالاهای بهداشتی یا شخصی (در صورت باز شدن) مشمول بازگشت نیستند</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-3">نحوه درخواست</h2>
            <p>
              از طریق بخش تماس با ما یا پشتیبانی، کد سفارش و دلیل بازگشت را اعلام کنید. پس از تأیید، راهنمای ارسال برای شما ارسال می‌شود.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-3">عودت وجه</h2>
            <p>
              پس از دریافت و بررسی کالا، مبلغ حداکثر طی ۷ روز کاری به حساب شما واریز می‌شود. هزینه ارسال بازگشت در صورت معیوب بودن کالا از سمت ما، بر عهده فروشگاه است.
            </p>
          </div>

          <div className="pt-4">
            <Link
              to="/contact"
              className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full"
            >
              درخواست پشتیبانی
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}