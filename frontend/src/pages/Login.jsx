import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useApp } from '../contexts/AppContext.jsx';
import { API } from '../lib/api.js';


export default function Login() {
  const navigate = useNavigate();

  const {
    user,
    setUser,
    showToast,
    refreshCart,
    refreshWishlist,
  } = useApp();


  const [identifier, setIdentifier] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPass, setShowPass] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);


  useEffect(() => {
    if (user) {
      navigate(
        '/dashboard',
        {
          replace: true,
        },
      );
    }
  }, [
    user,
    navigate,
  ]);


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const next = {};


    if (!identifier.trim()) {
      next.identifier =
        'ایمیل یا نام کاربری را وارد کنید.';
    }

    if (
      !password ||
      password.length < 8
    ) {
      next.password =
        'رمز عبور حداقل ۸ کاراکتر باشد.';
    }


    setErrors(next);


    if (
      Object.keys(next).length
    ) {
      return;
    }


    setSubmitting(true);


    try {
      const data =
        await API.login({
          identifier:
            identifier.trim(),
          password,
        });


      setUser(data.user);


      await Promise.all([
        refreshCart(),
        refreshWishlist(),
      ]);


      showToast(
        'با موفقیت وارد شدید.',
      );


      navigate(
        '/dashboard',
        {
          replace: true,
        },
      );
    } catch (error) {
      showToast(
        error.message ||
          'خطا در ورود.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      <div className="hidden lg:flex relative bg-stone-900 overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">

          <Link
            to="/"
            className="text-3xl font-bold tracking-tight"
          >
            ویترین
          </Link>

          <div>

            <p className="text-sm font-medium tracking-widest text-brand-400 mb-3">
              خوش آمدید
            </p>

            <h2 className="text-3xl font-bold leading-tight mb-3">
              استایل برای
              <br />
              هر لحظه
            </h2>

            <p className="text-white/70 text-sm max-w-xs leading-relaxed">
              وارد حساب شوید تا سفارش‌ها،
              علاقه‌مندی‌ها و خریدهای قبلی‌تان
              را مدیریت کنید.
            </p>

          </div>

          <p className="text-xs text-white/50">
            © ۱۴۰۵ ویترین
          </p>

        </div>
      </div>


      <div className="flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 lg:border-0">

          <Link
            to="/"
            className="text-xl font-bold lg:hidden"
          >
            ویترین
          </Link>

          <Link
            to="/shop"
            className="text-sm text-stone-500 hover:text-stone-800 mr-auto"
          >
            فروشگاه
          </Link>

        </div>


        <div className="flex-1 flex items-center justify-center px-6 py-10">

          <div className="w-full max-w-md">

            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              ورود به حساب
            </h1>

            <p className="text-sm text-stone-500 mb-8">
              ایمیل یا نام کاربری و رمز عبور خود را وارد کنید
            </p>


            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium mb-1.5"
                >
                  ایمیل یا نام کاربری
                </label>

                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value
                    )
                  }
                  autoComplete="username"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                  placeholder="email@example.com"
                />

                {errors.identifier && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.identifier}
                  </p>
                )}

              </div>


              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1.5"
                >
                  رمز عبور
                </label>

                <div className="relative">

                  <input
                    id="password"
                    type={
                      showPass
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPass(
                        (value) => !value
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    {showPass
                      ? 'مخفی'
                      : 'نمایش'}
                  </button>

                </div>

                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.password}
                  </p>
                )}

              </div>


              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 disabled:opacity-50"
              >
                {submitting
                  ? 'در حال ورود...'
                  : 'ورود'}
              </button>

            </form>


            <div className="relative my-8">

              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>

              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-stone-50 text-stone-400">
                  یا
                </span>
              </div>

            </div>


            <p className="text-center text-sm text-stone-500">

              حساب ندارید؟{' '}

              <Link
                to="/signup"
                className="text-brand-600 font-semibold hover:underline"
              >
                ثبت‌نام رایگان
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
