import {
  useEffect,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useApp } from '../contexts/AppContext.jsx';


export default function Logout() {
  const navigate = useNavigate();

  const { logout } =
    useApp();


  useEffect(() => {
    let mounted = true;

    logout().finally(() => {
      if (!mounted) {
        return;
      }

      const timer =
        setTimeout(() => {
          navigate(
            '/',
            {
              replace: true,
            },
          );
        }, 800);

      return () =>
        clearTimeout(timer);
    });


    return () => {
      mounted = false;
    };
  }, [
    logout,
    navigate,
  ]);


  return (
    <div className="font-sans bg-stone-50 text-stone-800 min-h-screen flex items-center justify-center p-4">

      <div className="text-center max-w-sm">

        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-200 flex items-center justify-center">

          <svg
            className="w-8 h-8 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>

        </div>

        <h1 className="text-xl font-bold mb-2">
          در حال خروج...
        </h1>

        <p className="text-sm text-stone-500 mb-6">
          از حساب کاربری خارج شدید.
        </p>

        <Link
          to="/"
          className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full text-sm"
        >
          بازگشت به فروشگاه
        </Link>

      </div>

    </div>
  );
}
