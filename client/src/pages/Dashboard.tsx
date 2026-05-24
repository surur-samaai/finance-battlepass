import { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useToast } from '../context/ToastContext'
import { completeQuest } from '../api/quests'
import { extractErrorMessage } from '../api/client'
import XPBar from '../components/XPBar'
import QuestCard from '../components/QuestCard'
import GulagOverlay from '../components/GulagOverlay'
import DevToolsPanel from '../components/DevToolsPanel'
import SeasonHistory from '../components/SeasonHistory'

interface DashboardProps {
  userId: number
}

const stateBadge: Record<'ACTIVE' | 'GULAG' | 'REDEMPTION', string> = {
  ACTIVE: 'bg-green-600 text-white',
  GULAG: 'bg-red-600 text-white animate-pulse',
  REDEMPTION: 'bg-amber-500 text-white',
}

export default function Dashboard({ userId }: DashboardProps) {
  const { user, quests, loading, error, refetch } = useDashboard(userId)
  const { showToasts } = useToast()
  const [completingQuestId, setCompletingQuestId] = useState<number | null>(null)

  const handleCompleteQuest = async (questId: number) => {
    setCompletingQuestId(questId)
    try {
      const result = await completeQuest(userId, questId)
      showToasts(result.toastMessages)
      refetch()
    } catch (err) {
      showToasts([extractErrorMessage(err)])
    } finally {
      setCompletingQuestId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/40 text-sm">Loading dashboard…</p>
      </div>
    )
  }

  if (error !== null || user === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-400 text-sm">{error ?? 'Failed to load dashboard.'}</p>
        <button
          onClick={refetch}
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const isBattlePassLocked =
    user.state === 'GULAG' || user.state === 'REDEMPTION'
  const gulagQuest = quests.find((q) => q.quest_type === 'GULAG_REDEMPTION')
  const gulagStreak = gulagQuest?.streak_count ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        <div className="flex flex-wrap items-center gap-4">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <div className="md:text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Playable Balance</p>
            <p className="text-3xl font-black text-white">
              R {user.playable_balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* XP bar or Gulag overlay */}
        {isBattlePassLocked ? (
          <GulagOverlay
            userState={user.state === 'GULAG' ? 'GULAG' : 'REDEMPTION'}
            streakCount={gulagStreak}
            currentXP={user.current_xp}
            xpToNext={user.xp_to_next_level}
            questTitle={gulagQuest?.title}
          />
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
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={handleCompleteQuest}
              isCompleting={completingQuestId === quest.id}
            />
          ))}
          {quests.length === 0 && (
            <p className="text-sm text-white/30">
              No active quests. Your Loadout is empty.
            </p>
          )}
        </div>
      </div>

      {/* Dev tools */}
      <DevToolsPanel userId={userId} onWebhookSuccess={refetch} showToasts={showToasts} />

      {/* Season history */}
      <SeasonHistory userId={userId} />
    </div>
  )
}
