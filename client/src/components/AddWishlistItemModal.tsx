import { useState } from 'react'
import { addWishlistItem } from '../api/wishlist'
import { extractErrorMessage } from '../api/client'
import { suggestWishlistTokenCost, formatSuggestedCost } from '../utils/wishlistPricing'

interface AddWishlistItemModalProps {
  userId: number
  onSuccess: () => void
  onClose: () => void
}

export default function AddWishlistItemModal({ userId, onSuccess, onClose }: AddWishlistItemModalProps) {
  const [itemName, setItemName] = useState('')
  const [priceZar, setPriceZar] = useState('')
  const [useManual, setUseManual] = useState(false)
  const [manualTokenCost, setManualTokenCost] = useState('')
  const [manualTokenType, setManualTokenType] = useState<'MICRO' | 'STANDARD'>('STANDARD')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedPrice = priceZar !== '' && !isNaN(parseFloat(priceZar)) ? parseFloat(priceZar) : null
  const suggestedCost = parsedPrice !== null ? suggestWishlistTokenCost(parsedPrice) : null
  const isManualRequired = suggestedCost !== null && 'manualRequired' in suggestedCost
  const isManualMode = useManual || isManualRequired

  const suggestedLabel = suggestedCost !== null ? formatSuggestedCost(suggestedCost) : '—'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (parsedPrice === null || parsedPrice <= 0) {
      setError('Price must be a positive number.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isManualMode) {
        const cost = parseInt(manualTokenCost, 10)
        if (isNaN(cost) || cost < 1) {
          setError('Token cost must be a whole number of at least 1.')
          setIsSubmitting(false)
          return
        }
        await addWishlistItem(userId, {
          item_name: itemName,
          price_zar: parsedPrice,
          token_cost: cost,
          token_type: manualTokenType,
        })
      } else {
        await addWishlistItem(userId, {
          item_name: itemName,
          price_zar: parsedPrice,
        })
      }
      onSuccess()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">Add to Vault</h3>
        <p className="text-sm text-white/50 mb-6">Add a new item to your wishlist.</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Nando's Quarter Chicken"
              required
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Real-World Price (ZAR)</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <span className="text-white/40 font-semibold">R</span>
              <input
                type="number"
                value={priceZar}
                onChange={(e) => setPriceZar(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
            <span className="text-white/50">Suggested token cost: </span>
            <span className="text-accent font-semibold">{suggestedLabel}</span>
          </div>

          {!isManualRequired && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUseManual(false)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  !useManual
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                Use suggested cost
              </button>
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  useManual
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                Set manually
              </button>
            </div>
          )}

          {isManualMode && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Token Cost</label>
                <input
                  type="number"
                  value={manualTokenCost}
                  onChange={(e) => setManualTokenCost(e.target.value)}
                  placeholder="1"
                  min="1"
                  step="1"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Token Type</label>
                <select
                  value={manualTokenType}
                  onChange={(e) => setManualTokenType(e.target.value as 'MICRO' | 'STANDARD')}
                  className="w-full rounded-md border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                >
                  <option value="MICRO">Micro-Token</option>
                  <option value="STANDARD">Standard Token</option>
                </select>
              </div>
            </div>
          )}

          {error !== null && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding…' : 'Add to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
