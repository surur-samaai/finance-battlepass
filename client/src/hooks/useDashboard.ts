import type { User, Quest } from '../types'

// Phase 3 stub — no API calls. Will be replaced with real fetch in Phase 4.
const stubUser: User = {
  username: 'Player One',
  level: 4,
  current_xp: 520,
  xp_to_next_level: 700,
  playable_balance: 3240.00,
  state: 'ACTIVE',
  wishlist_tokens_micro: 1,
  wishlist_tokens_standard: 0,
}

const stubQuests: Quest[] = [
  { id: 1, title: 'Zero Spend Day', xp_reward: 25, quest_type: 'DAILY', status: 'ACTIVE' },
  { id: 2, title: 'Meal Prep', xp_reward: 20, quest_type: 'DAILY', status: 'ACTIVE' },
  { id: 3, title: 'Weekly Streak', xp_reward: 100, quest_type: 'WEEKLY', status: 'ACTIVE' },
]

export function useDashboard(): { user: User; quests: Quest[] } {
  return { user: stubUser, quests: stubQuests }
}
