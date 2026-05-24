import { useState } from 'react'
import type { WishlistItem as WishlistItemType } from '../types'
import WishlistItem from '../components/WishlistItem'
import RedemptionModal from '../components/RedemptionModal'

const fakeWishlist: WishlistItemType[] = [
  {
    id: 1,
    item_name: "Nando's Quarter Chicken",
    price_zar: 89,
    token_cost: 1,
    token_type: 'MICRO',
    is_purchased: false,
  },
  {
    id: 2,
    item_name: 'New mechanical keyboard',
    price_zar: 650,
    token_cost: 3,
    token_type: 'STANDARD',
    is_purchased: false,
  },
  {
    id: 3,
    item_name: 'Coffee',
    price_zar: 45,
    token_cost: 1,
    token_type: 'MICRO',
    is_purchased: true,
  },
]

// Matches fakeUser tokens from Dashboard — hardcoded for Phase 3
const MICRO_TOKENS = 1
const STANDARD_TOKENS = 0

export default function Vault() {
  const [selectedItem, setSelectedItem] = useState<WishlistItemType | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Wishlist Vault</h1>
        <p className="text-sm text-white/40">
          Tokens available:{' '}
          <span className="text-accent font-semibold">{MICRO_TOKENS} Micro</span>
          {' · '}
          <span className="text-accent font-semibold">{STANDARD_TOKENS} Standard</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fakeWishlist.map((item) => (
          <WishlistItem
            key={item.id}
            item={item}
            microTokens={MICRO_TOKENS}
            standardTokens={STANDARD_TOKENS}
            onRedeem={(i) => setSelectedItem(i)}
          />
        ))}
      </div>

      {selectedItem !== null && (
        <RedemptionModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
