import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar.jsx';
import Header from './Header.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import Footer from './Footer.jsx';
import ToastContainer from './Toast.jsx';
import QuickViewModal from './QuickViewModal.jsx';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AnnouncementBar />
      <Header onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Outlet />

      <Footer />
      <ToastContainer />
      <QuickViewModal />
    </>
  );
}