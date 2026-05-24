export interface User {
  username: string
  level: number
  current_xp: number
  xp_to_next_level: number
  playable_balance: number
  state: 'ACTIVE' | 'GULAG' | 'REDEMPTION'
  wishlist_tokens_micro: number
  wishlist_tokens_standard: number
}

export interface Quest {
  id: number
  title: string
  xp_reward: number
  quest_type: 'DAILY' | 'WEEKLY' | 'GULAG_REDEMPTION'
  status: 'ACTIVE' | 'COMPLETE' | 'FAILED'
  streak_count?: number
}

export interface WishlistItem {
  id: number
  item_name: string
  price_zar: number
  token_cost: number
  token_type: 'MICRO' | 'STANDARD'
  is_purchased: boolean
}
