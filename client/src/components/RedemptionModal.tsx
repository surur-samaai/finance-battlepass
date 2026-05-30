import type { WishlistItem } from '../types'
import { formatCoinTier } from '../utils/rebrandCopy'

interface RedemptionModalProps {
  item: WishlistItem
  onClose: () => void
  onConfirm: () => void
  error?: string
  isConfirming?: boolean
}

export default function RedemptionModal({ item, onClose, onConfirm, error, isConfirming = false }: RedemptionModalProps) {
  const coinLabel = formatCoinTier(item.token_type, item.token_cost !== 1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">Confirm Redemption</h3>
        <p className="text-sm text-white/50 mb-6">This action cannot be undone.</p>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
          <p className="font-semibold text-white mb-1">{item.item_name}</p>
          <p className="text-sm text-white/50">R{item.price_zar}</p>
          <p className="text-sm text-accent font-semibold mt-1">
            Cost: {item.token_cost} {coinLabel}
          </p>
        </div>

        {error !== undefined && (
          <p className="text-xs text-red-400 mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
