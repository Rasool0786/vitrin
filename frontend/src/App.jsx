import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ScrollToTop from './components/ScrollToTop';

import Home         from './pages/Home.jsx';
import Shop         from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart         from './pages/Cart.jsx';
import Checkout     from './pages/Checkout.jsx';
import Wishlist     from './pages/Wishlist.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Orders       from './pages/Orders.jsx';
import OrderDetail  from './pages/OrderDetail.jsx';
import ProductForm  from './pages/ProductForm.jsx';
import About        from './pages/About.jsx';
import Contact      from './pages/Contact.jsx';
import FAQ          from './pages/FAQ.jsx';
import Guide        from './pages/Guide.jsx';
import Returns      from './pages/Returns.jsx';
import Shipping     from './pages/Shipping.jsx';
import Privacy      from './pages/Privacy.jsx';
import Terms        from './pages/Terms.jsx';

import Login      from './pages/Login.jsx';
import Signup     from './pages/Signup.jsx';
import Logout     from './pages/Logout.jsx';
import NotFound   from './pages/NotFound.jsx';
import ServerError from './pages/ServerError.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* صفحاتی که هدر/فوتر مشترک دارن */}
        <Route element={<Layout />}>
          <Route path="/"                 element={<Home />} />
          <Route path="/shop"             element={<Shop />} />
          <Route path="/product/:slug"    element={<ProductDetail />} />
          <Route path="/cart"             element={<Cart />} />
          <Route path="/checkout"         element={<Checkout />} />
          <Route path="/wishlist"         element={<Wishlist />} />
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/orders"           element={<Orders />} />
          <Route path="/orders/:code"     element={<OrderDetail />} />
          <Route path="/product-form"     element={<ProductForm />} />
          <Route path="/about"            element={<About />} />
          <Route path="/contact"          element={<Contact />} />
          <Route path="/faq"              element={<FAQ />} />
          <Route path="/guide"            element={<Guide />} />
          <Route path="/returns"          element={<Returns />} />
          <Route path="/shipping"         element={<Shipping />} />
          <Route path="/privacy"          element={<Privacy />} />
          <Route path="/terms"            element={<Terms />} />
          <Route path="/500"              element={<ServerError />} />
          <Route path="*"                 element={<NotFound />} />
        </Route>

        {/* صفحات تمام‌صفحه (بدون هدر/فوتر) */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </>
  );
}
