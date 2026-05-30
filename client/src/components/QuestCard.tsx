import type { Quest } from '../types'
import { rebrandQuestTitle } from '../utils/rebrandCopy'

interface QuestCardProps {
  quest: Quest
  onComplete: (questId: number) => Promise<void>
  isCompleting?: boolean
}

const questTypePill: Record<Quest['quest_type'], string> = {
  DAILY: 'bg-blue-900/60 text-blue-300',
  WEEKLY: 'bg-purple-900/60 text-purple-300',
  GULAG_REDEMPTION: 'bg-red-900/60 text-red-300',
}

const questTypeLabel: Record<Quest['quest_type'], string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  GULAG_REDEMPTION: 'Budgt Break',
}

export default function QuestCard({ quest, onComplete, isCompleting = false }: QuestCardProps) {
  const isManuallyCompletable =
    quest.quest_type !== 'GULAG_REDEMPTION' && quest.status === 'ACTIVE'

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-white">{rebrandQuestTitle(quest.title)}</span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              questTypePill[quest.quest_type]
            }`}
          >
            {questTypeLabel[quest.quest_type]}
          </span>
          <span className="text-xs text-accent font-semibold">+{quest.xp_reward} XP</span>
          {quest.streak_count !== undefined && quest.streak_count > 0 && (
            <span className="text-xs text-white/40">
              {quest.streak_count}/3 days
            </span>
          )}
        </div>
      </div>
      {isManuallyCompletable && (
        <button
          onClick={() => void onComplete(quest.id)}
          disabled={isCompleting}
          className="rounded-md bg-accent/20 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompleting ? '…' : 'Complete'}
        </button>
      )}
    </div>
  )
}
