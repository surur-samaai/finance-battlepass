import type { Quest } from '../types'

interface QuestCardProps {
  quest: Quest
}

const questTypePill: Record<Quest['quest_type'], string> = {
  DAILY: 'bg-blue-900/60 text-blue-300',
  WEEKLY: 'bg-purple-900/60 text-purple-300',
  GULAG_REDEMPTION: 'bg-red-900/60 text-red-300',
}

const questTypeLabel: Record<Quest['quest_type'], string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  GULAG_REDEMPTION: 'Gulag',
}

export default function QuestCard({ quest }: QuestCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-white">{quest.title}</span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              questTypePill[quest.quest_type]
            }`}
          >
            {questTypeLabel[quest.quest_type]}
          </span>
          <span className="text-xs text-accent font-semibold">+{quest.xp_reward} XP</span>
        </div>
      </div>
      <button
        onClick={() => {}}
        className="rounded-md bg-accent/20 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/30 transition-colors"
      >
        Complete
      </button>
    </div>
  )
}
