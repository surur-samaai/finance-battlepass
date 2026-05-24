import type { User, Quest } from '../types'
import XPBar from '../components/XPBar'
import QuestCard from '../components/QuestCard'
import GulagOverlay from '../components/GulagOverlay'
import DevToolsPanel from '../components/DevToolsPanel'

const fakeUser: User = {
  username: 'Player One',
  level: 4,
  current_xp: 520,
  xp_to_next_level: 700,
  playable_balance: 3240.00,
  state: 'GULAG', // change to 'GULAG' or 'REDEMPTION' to test other states
  wishlist_tokens_micro: 1,
  wishlist_tokens_standard: 0,
}

const fakeQuests: Quest[] = [
  { id: 1, title: 'Zero Spend Day', xp_reward: 25, quest_type: 'DAILY', status: 'ACTIVE' },
  { id: 2, title: 'Meal Prep', xp_reward: 20, quest_type: 'DAILY', status: 'ACTIVE' },
  { id: 3, title: 'Weekly Streak', xp_reward: 100, quest_type: 'WEEKLY', status: 'ACTIVE' },
]

const stateBadge: Record<User['state'], string> = {
  ACTIVE: 'bg-green-600 text-white',
  GULAG: 'bg-red-600 text-white animate-pulse',
  REDEMPTION: 'bg-amber-500 text-white',
}

export default function Dashboard() {
  const user = fakeUser
  const quests = fakeQuests
  const isGulag = user.state === 'GULAG'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
              stateBadge[user.state]
            }`}
          >
            {user.state}
          </span>
        </div>

        {/* Token counts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-sm">🪙</span>
            <span className="text-xs text-white/50">Micro</span>
            <span className="text-sm font-bold text-accent">{user.wishlist_tokens_micro}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-sm">💎</span>
            <span className="text-xs text-white/50">Standard</span>
            <span className="text-sm font-bold text-accent">{user.wishlist_tokens_standard}</span>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Level */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-accent/10">
              <span className="text-2xl font-black text-accent">{user.level}</span>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Level</p>
              <p className="text-3xl font-black text-white">{user.level}</p>
            </div>
          </div>

          {/* Playable balance */}
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Playable Balance</p>
            <p className="text-3xl font-black text-white">
              R {user.playable_balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* XP bar or Gulag overlay */}
        {isGulag ? (
          <GulagOverlay streakCount={1} />
        ) : (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
              XP Progress — Level {user.level}
            </p>
            <XPBar
              currentXP={user.current_xp}
              xpToNext={user.xp_to_next_level}
              isGulag={false}
            />
            {user.state === 'REDEMPTION' && (
              <p className="mt-2 text-xs text-amber-400 font-medium">
                Redemption in progress — XP accumulation paused.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quest list */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
          Active Quests
        </h2>
        <div className="space-y-2">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </div>

      {/* Dev tools */}
      <DevToolsPanel />
    </div>
  )
}
