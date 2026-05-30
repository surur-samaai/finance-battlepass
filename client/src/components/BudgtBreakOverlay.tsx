import XPBar from './XPBar'
import { rebrandQuestTitle } from '../utils/rebrandCopy'

interface BudgtBreakOverlayProps {
  userState: 'GULAG' | 'REDEMPTION'
  streakCount: number
  currentXP: number
  xpToNext: number
  questTitle?: string
}

export default function BudgtBreakOverlay({
  userState,
  streakCount,
  currentXP,
  xpToNext,
  questTitle = 'Budgt Break Redemption',
}: BudgtBreakOverlayProps) {
  const isRedemption = userState === 'REDEMPTION'
  const accentBorder = isRedemption ? 'border-amber-900/50' : 'border-red-900/50'
  const accentBg = isRedemption ? 'bg-amber-950/20' : 'bg-red-950/20'
  const accentText = isRedemption ? 'text-amber-400' : 'text-red-400'
  const questBorder = isRedemption ? 'border-amber-900/40' : 'border-red-900/40'
  const questBg = isRedemption ? 'bg-amber-900/10' : 'bg-red-900/10'
  const dotFilled = isRedemption ? 'bg-amber-400' : 'bg-red-400'
  const displayTitle = rebrandQuestTitle(questTitle)

  return (
    <div className={`rounded-xl border ${accentBorder} ${accentBg} p-6`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{isRedemption ? '⏳' : '🔒'}</span>
        <h2 className={`text-xl font-black tracking-widest uppercase ${accentText}`}>
          Budgt Pass Locked
        </h2>
      </div>

      <p className="text-sm text-white/60 mb-4">
        Violation detected. Complete your Redemption Quest to unlock.
      </p>

      <div className="mb-4">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
          XP Progress — Frozen
        </p>
        <XPBar
          currentXP={currentXP}
          xpToNext={xpToNext}
          isGulag={true}
          lockedIcon={isRedemption ? 'hourglass' : 'padlock'}
        />
      </div>

      <div className={`rounded-lg border ${questBorder} ${questBg} px-4 py-3 mb-4`}>
        <p className={`text-sm font-semibold ${accentText} mb-1`}>{displayTitle}</p>
        <p className="text-xs text-white/50 mb-3">
          Complete 3 consecutive zero discretionary spend days to unlock your Budgt Pass.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white">
            {isRedemption
              ? `Day ${streakCount} of 3 — Keep going.`
              : `Day ${streakCount} of 3`}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((day) => (
              <div
                key={day}
                className={`h-3 w-3 rounded-full ${
                  day <= streakCount ? dotFilled : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">
          How to escape
        </p>
        <p className="text-xs text-white/50 leading-relaxed">
          Spend nothing on discretionary purchases for 3 consecutive calendar days.
          Fixed bills (rent, medical aid, etc.) do not count against your streak.
          Each qualifying day advances your redemption progress automatically when
          the next bank transaction is processed.
        </p>
      </div>
    </div>
  )
}
