import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Shop from "./pages/Shop";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <p className="text-white/40 text-sm tracking-widest uppercase">
        Loading…
      </p>
    </div>
  );
}

export default function App() {
  const { session, appUser, loading, signOut } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (session === null) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (appUser === null) {
    return <LoadingScreen />;
  }

  if (!appUser.onboarding_complete) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0D0D0D] text-white font-sans">
        <nav className="border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center gap-4 md:gap-6">
          <span className="text-accent font-bold tracking-widest uppercase text-sm mr-2 md:mr-4 shrink-0">
            <span className="hidden sm:inline">Budgt Hero</span>
            <span className="sm:hidden">BH</span>
          </span>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? "text-accent" : "text-white/50 hover:text-white"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? "text-accent" : "text-white/50 hover:text-white"
              }`
            }
          >
            The Shop
          </NavLink>
          <button
            onClick={() => void signOut()}
            className="ml-auto text-sm font-medium text-white/40 hover:text-white transition-colors"
          >
            Logout
          </button>
        </nav>

        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard userId={appUser.id} />} />
            <Route path="/shop" element={<Shop userId={appUser.id} />} />
            <Route path="/vault" element={<Navigate to="/shop" replace />} />
            <Route
              path="/onboarding"
              element={<Navigate to="/" replace />}
            />
            <Route path="/reset-password" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </ToastProvider>
  );
}
