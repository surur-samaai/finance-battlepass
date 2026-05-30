import { useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { useToast } from '../context/ToastContext'
import { redeemItem, confirmRedeem, deleteWishlistItem } from '../api/wishlist'
import { extractErrorMessage } from '../api/client'
import type { WishlistItem as WishlistItemType } from '../types'
import WishlistItem from '../components/WishlistItem'
import RedemptionModal from '../components/RedemptionModal'
import AddWishlistItemModal from '../components/AddWishlistItemModal'

interface ShopProps {
  userId: number
}

export default function Shop({ userId }: ShopProps) {
  const { items, microTokens, standardTokens, loading, error, refetch } = useWishlist(userId)
  const { showToasts } = useToast()

  const [selectedItem, setSelectedItem] = useState<WishlistItemType | null>(null)
  const [redeemErrors, setRedeemErrors] = useState<Record<number, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({})
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)

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

  const handleDelete = async (itemId: number) => {
    setDeleteErrors((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setDeletingItemId(itemId)
    try {
      await deleteWishlistItem(userId, itemId)
      refetch()
    } catch (err) {
      setDeleteErrors((prev) => ({ ...prev, [itemId]: extractErrorMessage(err) }))
    } finally {
      setDeletingItemId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/40 text-sm">Loading The Shop…</p>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">The Shop</h1>
          <p className="text-sm text-white/40">
            Coins available:{' '}
            <span className="text-accent font-semibold">{microTokens} Micro Coins</span>
            {' · '}
            <span className="text-accent font-semibold">{standardTokens} Standard Coins</span>
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center space-y-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/50 max-w-md mx-auto">
            The Shop is empty. Add items to start earning towards them.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 transition-colors"
          >
            Add Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <WishlistItem
              key={item.id}
              item={item}
              microTokens={microTokens}
              standardTokens={standardTokens}
              onRedeem={(i) => void handleRedeem(i)}
              redeemError={redeemErrors[item.id]}
              onDelete={(id) => void handleDelete(id)}
              isDeleting={deletingItemId === item.id}
              deleteError={deleteErrors[item.id]}
            />
          ))}
        </div>
      )}

      {selectedItem !== null && (
        <RedemptionModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={() => void handleConfirm()}
          error={modalError ?? undefined}
          isConfirming={isConfirming}
        />
      )}

      {isAddModalOpen && (
        <AddWishlistItemModal
          userId={userId}
          onSuccess={() => {
            setIsAddModalOpen(false)
            refetch()
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  )
}
