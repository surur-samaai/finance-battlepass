import { useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { useToast } from '../context/ToastContext'
import { redeemItem, confirmRedeem } from '../api/wishlist'
import { extractErrorMessage } from '../api/client'
import type { WishlistItem as WishlistItemType } from '../types'
import WishlistItem from '../components/WishlistItem'
import RedemptionModal from '../components/RedemptionModal'

interface VaultProps {
  userId: number
}

export default function Vault({ userId }: VaultProps) {
  const { items, microTokens, standardTokens, loading, error, refetch } = useWishlist(userId)
  const { showToasts } = useToast()

  const [selectedItem, setSelectedItem] = useState<WishlistItemType | null>(null)
  const [redeemErrors, setRedeemErrors] = useState<Record<number, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleRedeem = async (item: WishlistItemType) => {
    setRedeemErrors((prev) => {
      const next = { ...prev }
      delete next[item.id]
      return next
    })
    try {
      await redeemItem(userId, item.id)
      setSelectedItem(item)
      setModalError(null)
    } catch (err) {
      setRedeemErrors((prev) => ({ ...prev, [item.id]: extractErrorMessage(err) }))
    }
  }

  const handleConfirm = async () => {
    if (selectedItem === null) return
    setIsConfirming(true)
    setModalError(null)
    try {
      const result = await confirmRedeem(userId, selectedItem.id)
      showToasts(result.toastMessages)
      setSelectedItem(null)
      refetch()
    } catch (err) {
      setModalError(extractErrorMessage(err))
    } finally {
      setIsConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/40 text-sm">Loading vault…</p>
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={refetch}
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Wishlist Vault</h1>
        <p className="text-sm text-white/40">
          Tokens available:{' '}
          <span className="text-accent font-semibold">{microTokens} Micro</span>
          {' · '}
          <span className="text-accent font-semibold">{standardTokens} Standard</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <WishlistItem
            key={item.id}
            item={item}
            microTokens={microTokens}
            standardTokens={standardTokens}
            onRedeem={(i) => void handleRedeem(i)}
            redeemError={redeemErrors[item.id]}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-white/30 col-span-2">No wishlist items yet.</p>
        )}
      </div>

      {selectedItem !== null && (
        <RedemptionModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={() => void handleConfirm()}
          error={modalError ?? undefined}
          isConfirming={isConfirming}
        />
      )}
    </div>
  )
}
