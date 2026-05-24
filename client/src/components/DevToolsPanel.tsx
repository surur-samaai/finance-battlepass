import { useState } from 'react'
import { fireMockBankWebhook } from '../api/webhooks'
import { extractErrorMessage } from '../api/client'
import type { GameEngineResult } from '../api/types'

interface DevToolsPanelProps {
  userId: number
  onWebhookSuccess: () => void
  showToasts: (messages: string[]) => void
}

interface WebhookFormState {
  amount: string
  merchant: string
  system_category: 'FIXED_BILL' | 'DISCRETIONARY'
}

export default function DevToolsPanel({ userId, onWebhookSuccess, showToasts }: DevToolsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<WebhookFormState>({
    amount: '',
    merchant: '',
    system_category: 'DISCRETIONARY',
  })
  const [result, setResult] = useState<GameEngineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFiring, setIsFiring] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    setIsFiring(true)

    try {
      const data = await fireMockBankWebhook({
        user_id: userId,
        amount: parseFloat(form.amount),
        merchant: form.merchant,
        system_category: form.system_category,
        timestamp: new Date().toISOString(),
      })
      setResult(data)
      if (data.toastMessages.length > 0) {
        showToasts(data.toastMessages)
      }
      onWebhookSuccess()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsFiring(false)
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>🛠</span>
          Dev Tools — Mock Bank Webhook
        </span>
        <span className="text-xs">{isOpen ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isOpen && (
        <form onSubmit={(e) => void handleSubmit(e)} className="border-t border-white/10 px-4 py-4 space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g. 89.00"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Merchant</label>
            <input
              type="text"
              value={form.merchant}
              onChange={(e) => setForm((prev) => ({ ...prev, merchant: e.target.value }))}
              placeholder="e.g. Nando's Rondebosch"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Category</label>
            <select
              value={form.system_category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  system_category: e.target.value as WebhookFormState['system_category'],
                }))
              }
              className="w-full rounded-md border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            >
              <option value="DISCRETIONARY">DISCRETIONARY</option>
              <option value="FIXED_BILL">FIXED_BILL</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isFiring}
            className="w-full rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFiring ? 'Firing…' : 'Fire Webhook'}
          </button>

          {error !== null && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}

          {result !== null && (
            <div className="mt-2 rounded-md border border-white/10 bg-black/30 px-3 py-3 space-y-1 text-xs font-mono">
              <p className="text-white/50 uppercase tracking-wider text-[10px] mb-2">Result</p>
              <p>
                <span className="text-white/40">newState: </span>
                <span className={result.newState === 'GULAG' ? 'text-red-400' : result.newState === 'REDEMPTION' ? 'text-amber-400' : 'text-green-400'}>
                  {result.newState}
                </span>
              </p>
              <p>
                <span className="text-white/40">xpAwarded: </span>
                <span className="text-accent">+{result.xpAwarded}</span>
              </p>
              <p>
                <span className="text-white/40">isViolation: </span>
                <span className={result.isViolation ? 'text-red-400' : 'text-white/70'}>
                  {String(result.isViolation)}
                </span>
              </p>
              {result.toastMessages.length > 0 && (
                <div>
                  <span className="text-white/40">messages: </span>
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {result.toastMessages.map((msg, i) => (
                      <li key={i} className="text-white/70">— {msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
