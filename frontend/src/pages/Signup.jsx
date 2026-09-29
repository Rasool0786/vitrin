import {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useApp } from '../contexts/AppContext.jsx';
import { API } from '../lib/api.js';


export default function Signup() {
  const navigate = useNavigate();

  const {
    setUser,
    showToast,
    refreshCart,
    refreshWishlist,
  } = useApp();


  const [username, setUsername] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [passwordConfirm, setPasswordConfirm] =
    useState('');

  const [showPass, setShowPass] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const next = {};


    if (!username.trim()) {
      next.username =
        'نام کاربری الزامی است.';
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      next.email =
        'ایمیل معتبر وارد کنید.';
    }

    if (
      !password ||
      password.length < 8
    ) {
      next.password =
        'رمز عبور حداقل ۸ کاراکتر باشد.';
    }

    if (
      password !==
      passwordConfirm
    ) {
      next.passwordConfirm =
        'رمزهای عبور یکسان نیستند.';
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
        await API.signup({
          username:
            username.trim(),

          email:
            email.trim().toLowerCase(),

          password,

          password_confirm:
            passwordConfirm,
        });


      setUser(data.user);


      await Promise.all([
        refreshCart(),
        refreshWishlist(),
      ]);


      showToast(
        'حساب کاربری با موفقیت ساخته شد.',
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
          'خطا در ثبت‌نام.',
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
              شروع کنید
            </p>

            <h2 className="text-3xl font-bold leading-tight mb-3">
              حساب خودت را
              <br />
              بساز
            </h2>

            <p className="text-white/70 text-sm max-w-xs leading-relaxed">
              حساب کاربری بسازید تا سفارش‌ها،
              علاقه‌مندی‌ها و اطلاعات خریدتان
              یکجا در دسترس باشد.
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
              ساخت حساب
            </h1>

            <p className="text-sm text-stone-500 mb-8">
              اطلاعات حساب خود را وارد کنید
            </p>


            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1.5"
                >
                  نام کاربری
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  autoComplete="username"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                  placeholder="vitrin_user"
                />

                {errors.username && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.username}
                  </p>
                )}

              </div>


              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                >
                  ایمیل
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                  placeholder="email@example.com"
                />

                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.email}
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
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                  placeholder="••••••••"
                />

                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.password}
                  </p>
                )}

              </div>


              <div>

                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium mb-1.5"
                >
                  تکرار رمز عبور
                </label>

                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
                  placeholder="••••••••"
                />

                {errors.passwordConfirm && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.passwordConfirm}
                  </p>
                )}

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowPass(
                    (value) =>
                      !value
                  )
                }
                className="text-xs text-stone-500"
              >
                {showPass
                  ? 'مخفی کردن رمز'
                  : 'نمایش رمز'}
              </button>


              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 disabled:opacity-50"
              >
                {submitting
                  ? 'در حال ثبت‌نام...'
                  : 'ساخت حساب'}
              </button>

            </form>


            <p className="text-center text-sm text-stone-500 mt-8">

              قبلاً حساب ساخته‌اید؟{' '}

              <Link
                to="/login"
                className="text-brand-600 font-semibold hover:underline"
              >
                ورود
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
