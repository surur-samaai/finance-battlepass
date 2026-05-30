import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { getGoogleLoginUrl } from './api/auth'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import Onboarding from './pages/Onboarding'
import { ToastProvider } from './context/ToastContext'
import Toast from './components/Toast'

export default function App() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <p className="text-white/40 text-sm tracking-widest uppercase">Loading…</p>
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">
            Budgt Hero
          </h1>
          <p className="text-white/40 text-sm">Turn your budget into a game.</p>
        </div>
        <a
          href={getGoogleLoginUrl()}
          className="rounded-lg border border-accent bg-accent/10 px-6 py-3 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
        >
          Sign in with Google
        </a>
      </div>
    )
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
                isActive ? 'text-accent' : 'text-white/50 hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-white/50 hover:text-white'
              }`
            }
          >
            The Shop
          </NavLink>
          <NavLink
            to="/onboarding"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-white/50 hover:text-white'
              }`
            }
          >
            Onboarding
          </NavLink>
          <button
            onClick={logout}
            className="ml-auto text-sm font-medium text-white/40 hover:text-white transition-colors"
          >
            Logout
          </button>
        </nav>

        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard userId={user.id} />} />
            <Route path="/shop" element={<Shop userId={user.id} />} />
            <Route path="/vault" element={<Navigate to="/shop" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </ToastProvider>
  )
}
