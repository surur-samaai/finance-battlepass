import { useState } from 'react'

interface WebhookFormState {
  amount: string
  merchant: string
  system_category: 'FIXED_BILL' | 'DISCRETIONARY'
}

export default function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<WebhookFormState>({
    amount: '',
    merchant: '',
    system_category: 'DISCRETIONARY',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Mock bank webhook payload:', {
      amount: parseFloat(form.amount),
      merchant: form.merchant,
      system_category: form.system_category,
    })
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
        <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-4 space-y-3">
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
            className="w-full rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            Fire Webhook
          </button>
        </form>
      )}
    </div>
  )
}
