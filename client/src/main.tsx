import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import { AuthProvider } from "./lib/auth";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CheckoutPage from "./pages/CheckoutPage";
import MockPaymentPage from "./pages/MockPaymentPage";
import GoogleCalendarMockPage from "./pages/GoogleCalendarMockPage";
import DashboardPage from "./pages/DashboardPage";
import HabitDetailPage from "./pages/HabitDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminBonusesPage from "./pages/admin/AdminBonusesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "pay/:id", element: <MockPaymentPage /> },
      { path: "mock-oauth/google", element: <GoogleCalendarMockPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "habit/:id", element: <HabitDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "users/:id", element: <AdminUserDetailPage /> },
      { path: "payments", element: <AdminPaymentsPage /> },
      { path: "content", element: <AdminContentPage /> },
      { path: "bonuses", element: <AdminBonusesPage /> },
      { path: "settings", element: <AdminSettingsPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);