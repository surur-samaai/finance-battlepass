import { useState } from 'react'
import type { WishlistItem as WishlistItemType } from '../types'
import { formatCoinTier } from '../utils/rebrandCopy'

interface WishlistItemProps {
  item: WishlistItemType
  microTokens: number
  standardTokens: number
  onRedeem: (item: WishlistItemType) => void
  redeemError?: string
  onDelete?: (itemId: number) => void
  isDeleting?: boolean
  deleteError?: string
}

export default function WishlistItem({
  item,
  microTokens,
  standardTokens,
  onRedeem,
  redeemError,
  onDelete,
  isDeleting = false,
  deleteError,
}: WishlistItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAffordable =
    item.token_type === 'MICRO'
      ? microTokens >= item.token_cost
      : standardTokens >= item.token_cost

  const tokenBalance = item.token_type === 'MICRO' ? microTokens : standardTokens
  const deficit = item.token_cost - tokenBalance
  const coinLabel = formatCoinTier(item.token_type, item.token_cost !== 1)
  const deficitCoinLabel = formatCoinTier(item.token_type, deficit !== 1)

  if (item.is_purchased) {
    return (
      <div className="relative rounded-lg border border-white/5 bg-white/5 p-4 opacity-30">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-15deg] rounded border-2 border-green-400 px-3 py-1 text-lg font-black tracking-widest text-green-400 uppercase">
            Unlocked
          </span>
        </div>
        <p className="font-semibold text-white">{item.item_name}</p>
        <p className="text-sm text-white/40">
          R{item.price_zar} · {item.token_cost} {coinLabel}
        </p>
      </div>
    )
  }

  const deleteButton = onDelete !== undefined && (
    <div className="mt-3">
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          Remove
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Remove this item?</span>
          <button
            onClick={() => {
              setShowDeleteConfirm(false)
              onDelete(item.id)
            }}
            disabled={isDeleting}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Removing…' : 'Confirm'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="text-xs text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
      {deleteError !== undefined && (
        <p className="text-xs text-red-400 mt-1">{deleteError}</p>
      )}
    </div>
  )

  if (isAffordable) {
    return (
      <div className="rounded-lg border-2 border-accent bg-white/5 p-4 wishlist-glow transition-shadow">
        <p className="font-semibold text-white">{item.item_name}</p>
        <p className="text-sm text-white/50 mb-3">
          R{item.price_zar} · {item.token_cost} {coinLabel}
        </p>
        <button
          onClick={() => onRedeem(item)}
          className="w-full rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/80 transition-colors"
        >
          Redeem
        </button>
        {redeemError !== undefined && (
          <p className="text-xs text-red-400 mt-2">{redeemError}</p>
        )}
        {deleteButton}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 opacity-50">
      <div className="flex items-start justify-between">
        <p className="font-semibold text-white">{item.item_name}</p>
        <span className="text-lg">🔒</span>
      </div>
      <p className="text-sm text-white/50 mb-3">
        R{item.price_zar} · {item.token_cost} {coinLabel}
      </p>
      <p className="text-xs text-red-400">
        Need {deficit} more {deficitCoinLabel}
      </p>
      {redeemError !== undefined && (
        <p className="text-xs text-red-400 mt-2">{redeemError}</p>
      )}
      {deleteButton}
    </div>
  )
}
