import { Outlet } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { usePageMeta } from "../../lib/seo";

/**
 * Каркас личного кабинета: собственная шапка (без публичного Navbar/Footer).
 * Используется для /dashboard, /dashboard/habit/:id и /dashboard/settings.
 */
export default function DashboardLayout() {
  usePageMeta("Личный кабинет");
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <DashboardHeader />
      <Outlet />
    </div>
  );
}