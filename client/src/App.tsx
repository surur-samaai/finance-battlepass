import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vault from './pages/Vault'
import Onboarding from './pages/Onboarding'
import { ToastProvider } from './context/ToastContext'
import Toast from './components/Toast'

export default function App() {
  return (
    <ToastProvider>
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans">
      <nav className="border-b border-white/10 px-6 py-3 flex items-center gap-6">
        <span className="text-accent font-bold tracking-widest uppercase text-sm mr-4">
          Finance Battle Pass
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
          to="/vault"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-white/50 hover:text-white'
            }`
          }
        >
          Vault
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
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </main>
    </div>
    <Toast />
    </ToastProvider>
  )
}
