import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * При переключении роута прокручиваем к якорю (если есть hash)
 * или к началу страницы.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  return null;
}

/**
 * Общий каркас: шапка (Navbar), контент текущего роута и футер.
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <ScrollManager />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}