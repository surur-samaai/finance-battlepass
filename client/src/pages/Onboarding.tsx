import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Step = 1 | 2 | 3

interface FixedCostRow {
  name: string
  amount: string
}

function suggestTokenCost(priceZar: number): string {
  if (priceZar < 50) return '1 Micro-Token'
  if (priceZar < 150) return '1 Standard Token'
  if (priceZar < 400) return '2 Standard Tokens'
  if (priceZar <= 800) return '3 Standard Tokens'
  return 'Set manually'
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [income, setIncome] = useState('')
  const [fixedCosts, setFixedCosts] = useState<FixedCostRow[]>([{ name: '', amount: '' }])
  const [wishlistName, setWishlistName] = useState('')
  const [wishlistPrice, setWishlistPrice] = useState('')

  const suggestedCost =
    wishlistPrice && !isNaN(parseFloat(wishlistPrice))
      ? suggestTokenCost(parseFloat(wishlistPrice))
      : null

  const addFixedCostRow = () => {
    setFixedCosts((prev) => [...prev, { name: '', amount: '' }])
  }

  const updateFixedCost = (index: number, field: keyof FixedCostRow, value: string) => {
    setFixedCosts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  const advanceStep = () => {
    if (step < 3) setStep((prev) => (prev + 1) as Step)
    else navigate('/')
  }

  const stepLabel = ['Monthly Income', 'Fixed Costs', 'Wishlist Item']

  return (
    <div className="max-w-lg space-y-8">
      {/* Step indicator */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Season Setup</h1>
        <div className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  s === step
                    ? 'bg-accent text-white'
                    : s < step
                    ? 'bg-accent/40 text-white'
                    : 'bg-white/10 text-white/30'
                }`}
              >
                {s}
              </div>
              <span
                className={`text-xs ${
                  s === step ? 'text-accent font-semibold' : 'text-white/30'
                }`}
              >
                {stepLabel[s - 1]}
              </span>
              {s < 3 && <span className="text-white/20 mx-1">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Monthly income */}
      {step === 1 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Monthly Net Income</h2>
          <p className="text-sm text-white/40">
            This is your take-home pay after tax. Fixed costs will be locked out of your playable
            balance.
          </p>
          <div>
            <label className="block text-xs text-white/50 mb-1">Net Income (ZAR)</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <span className="text-white/40 font-semibold">R</span>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-2 text-white placeholder-white/20 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Fixed costs */}
      {step === 2 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Fixed Costs</h2>
          <p className="text-sm text-white/40">
            Rent, medical aid, savings, subscriptions. These are locked immediately and hidden from
            your playable balance.
          </p>
          <div className="space-y-3">
            {fixedCosts.map((row, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateFixedCost(index, 'name', e.target.value)}
                  placeholder="e.g. Rent"
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
                />
                <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3">
                  <span className="text-white/40 text-sm">R</span>
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateFixedCost(index, 'amount', e.target.value)}
                    placeholder="0"
                    className="w-24 bg-transparent py-2 text-sm text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addFixedCostRow}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            + Add another
          </button>
        </div>
      )}

      {/* Step 3: Wishlist item */}
      {step === 3 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Add a Wishlist Item</h2>
          <p className="text-sm text-white/40">
            Add your first item to the Vault. Token cost is suggested based on price.
          </p>
          <div>
            <label className="block text-xs text-white/50 mb-1">Item Name</label>
            <input
              type="text"
              value={wishlistName}
              onChange={(e) => setWishlistName(e.target.value)}
              placeholder="e.g. Nando's Quarter Chicken"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Real-World Price (ZAR)</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <span className="text-white/40 font-semibold">R</span>
              <input
                type="number"
                value={wishlistPrice}
                onChange={(e) => setWishlistPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/20 focus:outline-none"
              />
            </div>
          </div>
          {suggestedCost && (
            <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
              <span className="text-white/50">Suggested token cost: </span>
              <span className="text-accent font-semibold">{suggestedCost}</span>
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={advanceStep}
        className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-white hover:bg-accent/80 transition-colors"
      >
        {step < 3 ? 'Next →' : 'Start Season'}
      </button>
    </div>
  )
}
