import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  return (
    <div
      id="announcement-bar"
      className="bg-stone-900 text-white text-center text-xs sm:text-sm py-2.5 px-4"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>ارسال رایگان بالای ۲ میلیون</span>
        <span className="hidden sm:inline text-white/40">|</span>
        <span className="hidden sm:inline">ضمانت بازگشت ۷ روزه</span>
        <span className="hidden md:inline text-white/40">|</span>
        <Link
          to="/shop?filter=sale"
          className="underline underline-offset-2 hover:text-brand-300"
        >
          تا ۳۰٪ تخفیف کالکشن پاییزه
        </Link>
      </p>
    </div>
  );
}